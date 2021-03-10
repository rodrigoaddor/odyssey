import { Client } from 'discord.js'
import { CommandManager } from './data/command'
import { EventManager } from './data/event'

const bot = new Client({
  presence: { status: 'idle' },
})

bot.on('ready', async () => {
  console.log(`Logged in as ${bot.user?.tag}`)

  EventManager.instance.load()
    .then((manager) => {
      for (const { event, handle } of manager.events) {
        bot.on(event, handle)
      }
      console.log(`Loaded ${manager.events.length} events.`)
    })

  CommandManager.instance.load()
    .then((manager) => {
      manager.register(bot)
      console.log(`Loaded ${manager.commands.length} commands.`)
    })

  const prod = process.env.NODE_ENV == 'production'
  bot.user?.setPresence({
    status: prod ? 'online' : 'dnd',
    activity: prod ? undefined : { type: 'PLAYING', name: 'with bugs' },
  })
})

process.on('SIGTERM', () => {
  bot.destroy()
  process.exit()
})

bot.login(process.env.TOKEN)

export default bot