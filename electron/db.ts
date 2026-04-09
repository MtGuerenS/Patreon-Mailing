import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'members.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')

  migrate(db)
  return db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      full_name TEXT,

      raw_addressee TEXT,
      raw_line_1 TEXT,
      raw_line_2 TEXT,
      raw_city TEXT,
      raw_state TEXT,
      raw_postal_code TEXT,
      raw_country TEXT,

      clean_addressee TEXT,
      clean_line_1 TEXT,
      clean_line_2 TEXT,
      clean_city TEXT,
      clean_state TEXT,
      clean_postal_code TEXT,
      clean_country TEXT,

      address_status TEXT DEFAULT 'missing',
      notes TEXT,
      updated_at TEXT
    )
  `)
}

// ---- Queries ----

export type DbMember = {
  id: string
  full_name: string | null
  raw_addressee: string | null
  raw_line_1: string | null
  raw_line_2: string | null
  raw_city: string | null
  raw_state: string | null
  raw_postal_code: string | null
  raw_country: string | null
  clean_addressee: string | null
  clean_line_1: string | null
  clean_line_2: string | null
  clean_city: string | null
  clean_state: string | null
  clean_postal_code: string | null
  clean_country: string | null
  address_status: 'verified' | 'check_needed' | 'missing'
  notes: string | null
  updated_at: string | null
}

export function getAllMembers(): DbMember[] {
  return getDb().prepare('SELECT * FROM members').all() as DbMember[]
}

export function getMemberById(id: string): DbMember | null {
  return (getDb().prepare('SELECT * FROM members WHERE id = ?').get(id) as DbMember) ?? null
}

export function upsertMember(member: Omit<DbMember, 'updated_at'>): void {
  getDb().prepare(`
    INSERT INTO members (
      id, full_name,
      raw_addressee, raw_line_1, raw_line_2, raw_city, raw_state, raw_postal_code, raw_country,
      clean_addressee, clean_line_1, clean_line_2, clean_city, clean_state, clean_postal_code, clean_country,
      address_status, notes, updated_at
    ) VALUES (
      @id, @full_name,
      @raw_addressee, @raw_line_1, @raw_line_2, @raw_city, @raw_state, @raw_postal_code, @raw_country,
      @clean_addressee, @clean_line_1, @clean_line_2, @clean_city, @clean_state, @clean_postal_code, @clean_country,
      @address_status, @notes, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      full_name = excluded.full_name,
      raw_addressee = excluded.raw_addressee,
      raw_line_1 = excluded.raw_line_1,
      raw_line_2 = excluded.raw_line_2,
      raw_city = excluded.raw_city,
      raw_state = excluded.raw_state,
      raw_postal_code = excluded.raw_postal_code,
      raw_country = excluded.raw_country,
      address_status = excluded.address_status,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).run({ ...member, updated_at: new Date().toISOString() })
}

export function updateCleanAddress(id: string, fields: {
  clean_addressee?: string
  clean_line_1?: string
  clean_line_2?: string
  clean_city?: string
  clean_state?: string
  clean_postal_code?: string
  clean_country?: string
  address_status: 'verified' | 'check_needed' | 'missing'
  notes?: string
}): void {
  getDb().prepare(`
    UPDATE members SET
      clean_addressee = @clean_addressee,
      clean_line_1 = @clean_line_1,
      clean_line_2 = @clean_line_2,
      clean_city = @clean_city,
      clean_state = @clean_state,
      clean_postal_code = @clean_postal_code,
      clean_country = @clean_country,
      address_status = @address_status,
      notes = @notes,
      updated_at = @updated_at
    WHERE id = @id
  `).run({ ...fields, id, updated_at: new Date().toISOString() })
}

export function setAddressStatus(id: string, status: 'verified' | 'check_needed' | 'missing'): void {
  getDb().prepare(`
    UPDATE members SET address_status = ?, updated_at = ? WHERE id = ?
  `).run(status, new Date().toISOString(), id)
}