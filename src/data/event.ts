import { ClientEvents } from 'discord.js'
import * as fs from 'fs/promises'
import * as path from 'path'

interface IEventListener<T extends keyof ClientEvents> {
  readonly name: string
  readonly event: T
  readonly handle: (...args: ClientEvents[T]) => void
}

export class EventListener<T extends keyof ClientEvents> {
  constructor(options: IEventListener<T>) {
    Object.assign(this, options)
  }
}

function isEventListener(obj: unknown): obj is IEventListener<keyof ClientEvents> {
  const asEvent = obj as IEventListener<keyof ClientEvents>
  return !!asEvent.event && !!asEvent.handle
}

export class EventManager {
  private static _instance: EventManager

  private constructor() {
    this.events = []
  }

  public static get instance(): EventManager {
    return (this._instance ??= new this())
  }

  // TODO: Implement command enabling/disabling, with available/enabled logic
  // private available: IEventListener<keyof ClientEvents>[]
  public events: IEventListener<keyof ClientEvents>[]

  public async load(): Promise<void> {
    this.events = []

    const eventsPath = path.resolve(__dirname, process.env.EVENTS_PATH || '../events')
    try {
      const files = await fs.readdir(eventsPath)
      for (const file of files) {
        if (file.match(/.[tj]s$/) && file[0] != '_') {
          const events = await import(path.resolve(eventsPath, file))
          for (const event of Object.values(events)) {
            if (isEventListener(event)) {
              this.events.push(event)
            }
          }
        }
      }
    } catch (e) {
      if (e.code == 'ENOENT') {
        console.warn(`Events folder "${eventsPath} doesn't exist!"`)
      } else {
        throw e
      }
    }
  }
}
