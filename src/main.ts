import Discord from 'discord.js'

const bot = new Discord.Client()

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user?.tag}`)
})

bot.login(process.env.TOKEN)