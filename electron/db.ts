import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import type { DbMember } from '../src/shared/db-types'

let db: Database.Database;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "members.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

interface PragmaColumn {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

function migrate(db: Database.Database) {
  const hasNotesColumn = (
    db.prepare(`PRAGMA table_info(members)`).all() as PragmaColumn[]
  ).some((col) => col.name === "notes");

  if (hasNotesColumn) {
    db.exec(`
      CREATE TABLE members_new (
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
        updated_at TEXT
      );
      INSERT INTO members_new SELECT
        id, full_name,
        raw_addressee, raw_line_1, raw_line_2, raw_city, raw_state, raw_postal_code, raw_country,
        clean_addressee, clean_line_1, clean_line_2, clean_city, clean_state, clean_postal_code, clean_country,
        address_status, updated_at
      FROM members;
      DROP TABLE members;
      ALTER TABLE members_new RENAME TO members;
    `);
  }

  // Fresh install — table doesn't exist yet
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
      updated_at TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS packed (
        member_id TEXT NOT NULL,
        year      INTEGER NOT NULL,
        month     INTEGER NOT NULL,
        PRIMARY KEY (member_id, year, month)
    )
`);
}

// ---- Queries ----

export function getAllMembers(): DbMember[] {
  return getDb().prepare("SELECT * FROM members").all() as DbMember[];
}

export function getMemberById(id: string): DbMember | null {
  return (
    (getDb()
      .prepare("SELECT * FROM members WHERE id = ?")
      .get(id) as DbMember) ?? null
  );
}

export function upsertMember(member: Omit<DbMember, "updated_at">): void {
  getDb()
    .prepare(
      `
    INSERT INTO members (
      id, full_name,
      raw_addressee, raw_line_1, raw_line_2, raw_city, raw_state, raw_postal_code, raw_country,
      clean_addressee, clean_line_1, clean_line_2, clean_city, clean_state, clean_postal_code, clean_country,
      address_status, updated_at
    ) VALUES (
      @id, @full_name,
      @raw_addressee, @raw_line_1, @raw_line_2, @raw_city, @raw_state, @raw_postal_code, @raw_country,
      @clean_addressee, @clean_line_1, @clean_line_2, @clean_city, @clean_state, @clean_postal_code, @clean_country,
      @address_status, @updated_at
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
      updated_at = excluded.updated_at
  `,
    )
    .run({ ...member, updated_at: new Date().toISOString() });
}

export function updateCleanAddress(
  id: string,
  fields: {
    clean_addressee?: string;
    clean_line_1?: string;
    clean_line_2?: string;
    clean_city?: string;
    clean_state?: string;
    clean_postal_code?: string;
    clean_country?: string;
    address_status: "verified" | "check_needed" | "missing";
  },
): void {
  getDb()
    .prepare(
      `
    UPDATE members SET
      clean_addressee = @clean_addressee,
      clean_line_1 = @clean_line_1,
      clean_line_2 = @clean_line_2,
      clean_city = @clean_city,
      clean_state = @clean_state,
      clean_postal_code = @clean_postal_code,
      clean_country = @clean_country,
      address_status = @address_status,
      updated_at = @updated_at
    WHERE id = @id
  `,
    )
    .run({ ...fields, id, updated_at: new Date().toISOString() });
}

export function setAddressStatus(
  id: string,
  status: "verified" | "check_needed" | "missing",
): void {
  getDb()
    .prepare(
      `
    UPDATE members SET address_status = ?, updated_at = ? WHERE id = ?
  `,
    )
    .run(status, new Date().toISOString(), id);
}

interface PackedRow {
  member_id: string;
}

export function getPackedIds(year: number, month: number): string[] {
  return getDb()
    .prepare(`SELECT member_id FROM packed WHERE year = ? AND month = ?`)
    .all(year, month)
    .map((r) => (r as PackedRow).member_id);
}

export function setPacked(
  member_id: string,
  year: number,
  month: number,
  packed: boolean,
): void {
  if (packed) {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO packed (member_id, year, month) VALUES (?, ?, ?)`,
      )
      .run(member_id, year, month);
  } else {
    getDb()
      .prepare(
        `DELETE FROM packed WHERE member_id = ? AND year = ? AND month = ?`,
      )
      .run(member_id, year, month);
  }
}