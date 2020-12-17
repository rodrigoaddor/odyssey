import Discord from 'discord.js'
import { EventManager } from './data/event'

const bot = new Discord.Client({
  presence: { status: 'idle' },
})

bot.on('ready', async () => {
  console.log(`Logged in as ${bot.user?.tag}`)

  const eventManager = EventManager.instance
  await eventManager.load()
  for (const { event, handle } of eventManager.events) {
    bot.on(event, handle)
  }
  console.log(`Loaded ${eventManager.events.length} events.`)

  const prod = process.env.NODE_ENV == 'production'
  bot.user?.setPresence({
    status: prod ? 'online' : 'dnd',
    activity: prod ? undefined : { type: 'PLAYING', name: 'with bugs' },
  })
})

process.on('SIGTERM', () => {
  bot.destroy()
})

bot.login(process.env.TOKEN)
