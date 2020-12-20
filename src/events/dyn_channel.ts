import { VoiceChannel } from 'discord.js'
import { EventListener } from '../data/event'

export default new EventListener({
  name: 'dynChannel',
  event: 'voiceStateUpdate',
  handle: async ({ channel: oldChannel }, { channel: newChannel }) => {
    if (oldChannel) {
      const category = oldChannel.parent
      if (category) {
        const name = oldChannel.name.split(' ').slice(0, -1)
          .join(' ') + ' '

        const channels = category.children
          .filter((channel) => channel.name.startsWith(name) && channel.type == 'voice')
          .sorted((a, b) => +a - +b)

        const withoutUsers = channels.filter((channel) => channel.members.size == 0)

        for (const channel of withoutUsers.array().slice(1)) {
          channel.delete()
        }
      }
    }

    if (newChannel) {
      const category = newChannel.parent
      if (category) {
        const name = newChannel.name.split(' ').slice(0, -1)
          .join(' ') + ' '

        const channels = category.children
          .filter((channel) => channel.name.startsWith(name) && channel.type == 'voice')
          .sorted((a, b) => +a - +b)
          .mapValues((channel) => channel as VoiceChannel)

        const lastChannel = channels.last()

        if (lastChannel) {
          const lastNumber = +lastChannel.name.split(' ').slice(-1)[0]
          const withoutUsers = channels.filter((channel) => channel.members.size == 0)
          if (withoutUsers.size == 0 && !isNaN(lastNumber)) {
            await newChannel.guild.channels.create(`${name}${lastNumber + 1}`, {
              type: 'voice',
              parent: category,
              position: lastChannel.rawPosition,
              bitrate: lastChannel.bitrate,
              permissionOverwrites: lastChannel.permissionOverwrites,
              userLimit: lastChannel.userLimit,
              reason: 'Create voice chat on demand',
            })
          }
        }
      }
    }
  },
})
