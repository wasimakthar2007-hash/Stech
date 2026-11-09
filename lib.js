import { neon } from '@neondatabase/serverless';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

let localDatabase;
const localDatabasePath = path.join(process.cwd(), 'data', 'attendance.sqlite');

function getLocalDatabase() {
  if (!localDatabase) {
    mkdirSync(path.dirname(localDatabasePath), { recursive: true });
    localDatabase = new DatabaseSync(localDatabasePath);
    localDatabase.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    localDatabase.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
        class_name TEXT,
        roll_no TEXT,
        date_of_birth DATE
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('P','A','L')),
        marked_by INTEGER,
        UNIQUE(student_id,date)
      );
      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        title TEXT,
        type TEXT DEFAULT 'general'
      );
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        class_name TEXT NOT NULL,
        date DATE NOT NULL,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(class_name,date)
      );
    `);
  }
  return localDatabase;
}

function runLocalQuery(strings, values) {
  let statement = strings.reduce((query, part, index) =>
    query + part + (index < values.length ? '?' : ''), '');
  const parameters = values.map(value => typeof value === 'boolean' ? Number(value) : value);
  statement = statement
    .replace(/\bserial\s+primary\s+key\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/::(?:date|int)\b/gi, '')
    .replace(/to_char\s*\(\s*date\s*,\s*'YYYY-MM-DD'\s*\)/gi, "strftime('%Y-%m-%d', date)");

  const prepared = getLocalDatabase().prepare(statement);
  if (prepared.columns().length) return Promise.resolve(prepared.all(...parameters));
  prepared.run(...parameters);
  return Promise.resolve([]);
}

export const isLocalDatabase = () => !process.env.DATABASE_URL;
export const sql = (strings, ...values) => {
  if (process.env.DATABASE_URL) return neon(process.env.DATABASE_URL)(strings, ...values);
  return runLocalQuery(strings, values);
};
const key = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export async function setSession(u) {
  const t = await new SignJWT({ id: u.id, role: u.role, name: u.name, cls: u.class_name || '' })
    .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key());
  cookies().set('s', t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}
export async function getSession() {
  const token = cookies().get('s')?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, key())).payload; } catch { return null; }
}
export const clearSession = () => cookies().delete('s');
