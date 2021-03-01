import { CommandOptionType, Command, CommandOption, CommandOptionChoice } from '../data/command'

export default new Command('room')
  .setDescription('Create and manage your own personal channel')
  .addOption(
    new CommandOption('create')
      .setType(CommandOptionType.SubCommand)
      .setDescription('Create a new room')
      .addOption(new CommandOption('name')
        .setDescription('Your room\'s name')
        .setType(CommandOptionType.String))
      .addOption(
        new CommandOption('type')
          .setDescription('Your room\'s type')
          .setType(CommandOptionType.String)
          .addChoice(new CommandOptionChoice('Text', 'text'))
          .addChoice(new CommandOptionChoice('Voice', 'voice'))
      )
  )
  .addOption(
    new CommandOption('set')
      .setDescription('Modify your room settings')
      .setType(CommandOptionType.SubCommandGroup)
      .addOption(
        new CommandOption('limit')
          .setDescription('Limits the number of users that can connect')
          .setType(CommandOptionType.SubCommand)
          .addOption(
            new CommandOption('amount')
              .setDescription('The amount of users that can connect to this channel')
              .setType(CommandOptionType.Integer)
              .setRequired(true)
          )
      )
  )
