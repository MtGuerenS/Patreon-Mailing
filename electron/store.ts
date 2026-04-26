import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

type StoreData = Record<string, any>

const storePath = () => path.join(app.getPath('userData'), 'app-store.json')

function read(): StoreData {
  try {
    return JSON.parse(fs.readFileSync(storePath(), 'utf-8'))
  } catch {
    return {}
  }
}

function write(data: StoreData): void {
  fs.writeFileSync(storePath(), JSON.stringify(data, null, 2), 'utf-8')
}

export const store = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    return (read()[key] as T) ?? defaultValue
  },
  set(key: string, value: any): void {
    const data = read()
    data[key] = value
    write(data)
  },
  delete(key: string): void {
    const data = read()
    delete data[key]
    write(data)
  },
  clear(): void {
    write({})
  }
}