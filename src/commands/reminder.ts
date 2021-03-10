import * as chrono from 'chrono-node'
import { Command, CommandOption, CommandOptionType } from '../data/command'
import { GuildMember, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'
import fs from 'fs/promises'
import path from 'path'
import bot from '../main'

interface Reminder {
  date: number
  channel: string
  message?: string
  author: string
  createdAt: number
  mentions: Set<string>
}

let reminders: Reminder[] = []
const remindersPath = path.resolve(process.cwd(), process.env.REMINDERS_PATH ?? 'reminders.json')

const saveReminders = () => fs.writeFile(
  remindersPath,
  JSON.stringify(reminders, (k ,v) => k == 'mentions' && v instanceof Set ? [...v] : v), 
  { encoding: 'utf-8' }
)

fs.readFile(remindersPath, { encoding: 'utf-8', flag: 'a+' })
  .then((data) => {
    try {
      reminders = JSON.parse(data, (k, v) => k == 'mentions' && v instanceof Array ? new Set(v) : v)
    } catch (_) {
      console.log('Invalid or empty reminders file. Saving new...')
      saveReminders()
    }

    checkReminders()
    setTimeout(() => {
      checkReminders()
      setInterval(checkReminders, 60e3)
    }, 60e3 - (new Date()
      .getTime() % 60e3) + 100)
  })

const checkReminders = async () => {
  let modified = false
  for (const index in reminders) {
    const reminder = reminders[index]
    if (reminder.date <= Date.now()) {
      const channel = await bot.channels.fetch(reminder.channel)
      if (channel && channel.type == 'text') {
        const textChannel = channel as TextChannel
        const author = await textChannel.guild.members.fetch(reminder.author)
        const mentions = [...reminder.mentions].map(id => `<@${id}>`).join(' ')
        textChannel.send(mentions, {
          embed: new MessageEmbed({
            title: 'Reminder',
            description: reminder.message,
            timestamp: reminder.createdAt,
            footer: {
              text: `Reminder created by ${author.displayName}`,
              iconURL: author.user.avatarURL() ?? undefined,
            },
          }),
        })
      }

      modified = true
      reminders.splice(+index, 1)
    }
  }

  if (modified) saveReminders()
}

export default new Command('reminder')
  .setDescription('Create and manage reminders')
  .addOption(
    new CommandOption('new')
      .setType(CommandOptionType.SubCommand)
      .setDescription('Create a new reminder')
      .addOption(new CommandOption('time')
        .setDescription('Time for the reminder')
        .setRequired(true))
      .addOption(new CommandOption('message')
        .setDescription('Message to be reminded of'))
      .setExecutor(async (command) => {
        const date = chrono.parseDate(command.options[0].value, new Date(), { forwardDate: true })

        const member: GuildMember = command.member

        if (date) {
          date.setSeconds(0)
          date.setMilliseconds(0)
        
          const reminder: Reminder = {
            date: +date,
            channel: command.channel,
            createdAt: Date.now(),
            author: member.user.id,
            message: command.options[1]?.value,
            mentions: new Set([command.member.user.id]),
          }
        
          const index = reminders.push(reminder) - 1
          saveReminders()

          const formattedDate = date.toLocaleString('en-US', {
            timeZone: 'America/Sao_Paulo',
            hour12: false,
            weekday: 'long',
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })

          // @ts-ignore
          bot.api.interactions(command.id, command.token).callback.post({
            data: { type: 2 },
          })

          const channel = (await bot.channels.fetch(command.channel)) as TextChannel
          const embed = new MessageEmbed({
            title: 'Reminder Created',
            description: `<@${member.user.id}> created a reminder for ${formattedDate}
              \nReact with ⏰ to also be notified.`,
            timestamp: reminder.createdAt,
            author: {
              name: member.displayName,
            }
          })

          const message = await channel.send(embed)
          message.react('⏰')

          const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name == '⏰' && user.id != bot.user?.id
          message.createReactionCollector(filter, {time: Math.min(60e3 * 5, +date - Date.now()), dispose: true})
            .on('collect', (_, user) => {
              reminders[index].mentions.add(user.id)
              saveReminders()
            })
            .on('remove', (_, user) => {
              reminders[index].mentions.delete(user.id)
              saveReminders()
            })
            .on('end', () => {
              if (!message.deleted) {
                embed.setDescription(embed.description?.split('\n')[0])
                message.edit(embed)
                message.reactions.removeAll()
              }
            })
        } else {
        // @ts-ignore
          bot.api.interactions(command.id, command.token).callback.post({
            data: {
              type: 3,
              data: {
                content: `<@${command.member.user.id}>, Invalid time "${command.options[0].value}"`,
              },
            },
          })
        }
      })
  )
