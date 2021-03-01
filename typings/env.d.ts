declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN: string
    EVENTS_PATH?: string
    COMMANDS_PATH?: string
    NODE_ENV: 'production' | 'development'
    REMINDERS_PATH?: string
  }
}
