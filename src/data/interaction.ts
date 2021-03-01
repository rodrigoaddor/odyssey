import { GuildMember,  Snowflake } from 'discord.js'

export interface Interaction {
  id: Snowflake
  type: InteractionType
  data?: ApplicationCommandInteractionData
  guild_id: Snowflake
  channel_id: Snowflake
  member: GuildMember
  token: string
  version: number
}

export enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
}

export interface ApplicationCommandInteractionData {
  id: Snowflake
  name: string
  options?: ApplicationCommandInteractionDataOption[]
}

export interface ApplicationCommandInteractionDataOption {
  name: string
  value?: string
  options?: ApplicationCommandInteractionDataOption[]
}

export interface InteractionResponse {
  type: InteractionResponseType
  data: InteractionApplicationCommandCallbackData
}

export enum InteractionResponseType {
  Pong = 1,
  Acknowledge = 2,
  ChannelMessage = 3,
  ChannelMessageWithSource = 4,
  ACKWithSource = 5,
}

export interface InteractionApplicationCommandCallbackData {
  content: string
}
