import * as chrono from 'chrono-node'
import { Command, CommandOption, CommandOptionType } from '../data/command'
import { MessageEmbed, TextChannel } from 'discord.js'
import fs from 'fs/promises'
import path from 'path'
import bot from '../main'

interface Reminder {
  date: number
  channel: string
  message?: string
  author: string
  createdAt: number
}

let reminders: Reminder[] = []
const remindersPath = path.resolve(process.cwd(), process.env.REMINDERS_PATH ?? 'reminders.json')

const saveReminders = () => fs.writeFile(remindersPath, JSON.stringify(reminders), { encoding: 'utf-8' })

fs.readFile(remindersPath, { encoding: 'utf-8', flag: 'a+' }).then((data) => {
  try {
    reminders = JSON.parse(data)
  } catch (_) {
    console.log('Invalid or empty reminders file. Saving new...')
    saveReminders()
  }

  checkReminders()
  setTimeout(() => {
    checkReminders()
    setInterval(checkReminders, 60e3)
  }, 60e3 - (new Date().getTime() % 60e3) + 100)
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
        const mention = `<@${author.id}>`
        textChannel.send(mention, {
          embed: new MessageEmbed({
            title: 'Reminder',
            description: reminder.message,
            timestamp: reminder.createdAt,
            footer: {
              text: `Reminder by ${author.displayName}`,
              icon_url: author.user.avatarURL() ?? undefined,
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

export default new Command('reminder').setDescription('Create and manage reminders')
  .addOption(
    new CommandOption('new')
      .setType(CommandOptionType.SubCommand)
      .setDescription('Create a new reminder')
      .addOption(new CommandOption('time').setDescription('Time for the reminder')
        .setRequired(true))
      .addOption(new CommandOption('message').setDescription('Message to be reminded of'))
      .setExecutor((command) => {
        const date = chrono.parseDate(command.options[0].value, new Date(), { forwardDate: true })
        date.setSeconds(0)
        date.setMilliseconds(0)

        if (date) {
          const reminder: Reminder = {
            date: +date,
            channel: command.channel,
            createdAt: Date.now(),
            author: command.member.user.id,
            message: command.options[1]?.value,
          }
          reminders.push(reminder)
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
            data: {
              type: 3,
              data: {
                content: `<@${command.member.user.id}>, reminder created! I'll remind you at ${formattedDate}`,
              },
            },
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
