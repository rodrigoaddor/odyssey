import path from 'path'
import fs from 'fs/promises'
import { Client, Message } from 'discord.js'
import { Interaction, InteractionType } from './interaction'

export type CommandExecutor = (options: { [key: string]: any }) => void

export class Command {
  name: string
  description = 'No description provided'
  options: CommandOption[] = []
  executor?: CommandExecutor

  constructor(name: string) {
    this.name = name
  }

  setDescription(description: string): this {
    this.description = description
    return this
  }

  addOption(option: CommandOption): this {
    this.options.push(option)
    return this
  }
}

export class CommandOption extends Command {
  type: CommandOptionType = CommandOptionType.String
  default?: boolean
  required?: boolean
  choices?: CommandOptionChoice[]
  executor?: CommandExecutor

  constructor(name: string) {
    super(name)
  }

  setType(type: CommandOptionType): this {
    this.type = type
    return this
  }

  setDescription(description: string): this {
    this.description = description
    return this
  }

  setDefault(isDefault: boolean): this {
    this.default = isDefault
    return this
  }

  setRequired(isRequired: boolean): this {
    this.required = isRequired
    return this
  }

  addChoice(choice: CommandOptionChoice): this {
    (this.choices ??= []).push(choice)
    return this
  }

  addOption(option: CommandOption): this {
    (this.options ??= []).push(option)
    return this
  }

  setExecutor(executor: CommandExecutor): this {
    this.executor = executor
    return this
  }
}

export class CommandOptionChoice {
  constructor(public name: string, public value: string | number) {}
}

export enum CommandOptionType {
  SubCommand = 1,
  SubCommandGroup = 2,
  String = 3,
  Integer = 4,
  Boolean = 5,
  User = 6,
  Channel = 7,
  Role = 8,
}

export class CommandManager {
  private static _instance: CommandManager

  private constructor() {
    this.commands = []
  }

  public static get instance(): CommandManager {
    return (this._instance ??= new this())
  }

  public commands: Command[]

  public async load(): Promise<this> {
    this.commands = []

    const commandsPath = path.resolve(__dirname, process.env.COMMANDS_PATH || '../commands')
    try {
      const files = await fs.readdir(commandsPath)
      for (const file of files) {
        if (file.match(/.[tj]s$/) && file[0] != '_') {
          const commands = await import(path.resolve(commandsPath, file))
          for (const command of Object.values(commands)) {
            if (command instanceof Command) {
              this.commands.push(command)
            }
          }
        }
      }
      return this
    } catch (e) {
      if (e.code == 'ENOENT') {
        console.warn(`Commands folder "${commandsPath} doesn't exist!"`)
        return this
      } else {
        throw e
      }
    }
  }

  public register(client: Client): this {
    client.on('message', this.handleRegister)

    // @ts-ignore
    client.ws.on('INTERACTION_CREATE', async (interaction: Interaction) => {
      if (interaction.type == InteractionType.ApplicationCommand) {
        let data: { [key: string]: any } = interaction.data as any
        let command = this.commands.find(({ name }) => name == data?.name)
        if (command) {
          let subcommand
          do {
            subcommand = command.options.find(
              ({ type, name }) => type == CommandOptionType.SubCommand && name == data?.options?.[0].name
            )
            if (subcommand) {
              command = subcommand
              data = data.options[0]
            }
          } while (subcommand)
          command?.executor?.({
            ...data,
            member: interaction.member,
            guild: interaction.guild_id,
            channel: interaction.channel_id,
            id: interaction.id,
            token: interaction.token,
          })
        } else {
          console.log('Unknown Command', JSON.stringify(interaction.data, null, 2))
        }
      }
    })

    return this
  }

  public handleRegister = async (message: Message): Promise<this> => {
    if (message.content.startsWith('.register')) {
      const [, commandName] = message.content.split(' ')
      const bot = message.client
      const command = this.commands.find(({ name }) => name == commandName)
      if (command && bot.user && message.guild) {
        const api: any = bot['api']
        await api.applications(bot.user.id).guilds(message.guild.id).commands.post({
          data: command,
        })
        console.log(`Registered command "${command.name}" for guild "${message.guild.name}"`)
      }
    }
    return this
  }
}
