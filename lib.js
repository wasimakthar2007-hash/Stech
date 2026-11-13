import { neon } from '@neondatabase/serverless';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

let localDatabase;
let neonClient;
let neonClientUrl;
const localDatabasePath = path.join(process.cwd(), 'data', 'attendance.sqlite');
const postgresUrlVariables = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING'
];

function cleanDatabaseUrl(raw) {
  let value = String(raw || '').trim();
  value = value.replace(/^psql\s+/i, '').replace(/^DATABASE_URL\s*=\s*/i, '');
  value = value.replace(/^(['"`])([\s\S]*)\1;?$/, '$2').trim();
  return value.replace(/;$/, '').trim();
}

export function getDatabaseConfig() {
  const source = postgresUrlVariables.find(name => process.env[name]?.trim());
  const url = source ? cleanDatabaseUrl(process.env[source]) : '';
  let host = null;
  let valid = false;
  try {
    const parsed = new URL(url);
    valid = ['postgres:', 'postgresql:'].includes(parsed.protocol) &&
      Boolean(parsed.hostname && parsed.username && parsed.pathname.length > 1);
    host = parsed.hostname || null;
  } catch {
    // Keep diagnostics safe when a connection string is malformed.
  }
  return {
    url,
    source: source || null,
    host,
    valid,
    isNeonHost: Boolean(host && /(^|\.)neon\.(tech|build)$/i.test(host))
  };
}

export function describeDatabaseError(error) {
  const config = getDatabaseConfig();
  const text = String(error?.message || '');
  const code = error?.code || error?.sourceError?.code || error?.cause?.code ||
    error?.sourceError?.cause?.code || '';
  const base = {
    code: /^[A-Za-z0-9_-]+$/.test(String(code)) ? String(code) : String(error?.name || 'UNKNOWN'),
    host: config.host,
    source: config.source
  };

  if (!config.url) {
    if (process.env.VERCEL !== '1') {
      return {
        ...base,
        reason: 'local_sqlite_error',
        hint: 'The local SQLite query failed. Check the server log for the SQL error.'
      };
    }
    return { ...base, reason: 'no_url', hint: 'No database URL variable is set on the server.' };
  }
  if (!config.valid || /not a valid URL/i.test(text)) {
    return {
      ...base,
      reason: 'invalid_url',
      hint: 'The URL must be a PostgreSQL connection string. Remove surrounding quotes, spaces, and any leading psql command.'
    };
  }
  if (!config.isNeonHost) {
    return {
      ...base,
      reason: 'unsupported_host',
      hint: 'The configured host is not a Neon host. @neondatabase/serverless requires a Neon connection URL; use a Neon URL or configure a driver that supports this provider.'
    };
  }
  if (/password authentication failed|28P01|28000/i.test(`${text} ${code}`)) {
    return {
      ...base,
      reason: 'auth_failed',
      hint: 'The database rejected the username or password. Copy a fresh connection string from the database provider and update the deployment environment.'
    };
  }
  if (/does not exist|3D000/i.test(`${text} ${code}`)) {
    return {
      ...base,
      reason: 'database_missing',
      hint: 'The database named in the connection URL does not exist on this server.'
    };
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(`${text} ${code}`)) {
    return {
      ...base,
      reason: 'host_not_found',
      hint: 'The database host could not be resolved. Check that the host is copied correctly and the provider project is active.'
    };
  }
  if (/ETIMEDOUT|ECONNREFUSED|timeout|fetch failed/i.test(`${text} ${code}`)) {
    return {
      ...base,
      reason: 'unreachable',
      hint: 'Neon did not respond. Check the project and compute status, provider limits, and network restrictions.'
    };
  }
  if (/42P01/.test(String(code)) || /relation .* does not exist/i.test(text)) {
    return {
      ...base,
      reason: 'tables_missing',
      hint: 'The database is reachable but its attendance tables are missing. Run POST /api/setup once.'
    };
  }
  if (/42501|permission denied/i.test(`${text} ${code}`)) {
    return {
      ...base,
      reason: 'permission_denied',
      hint: 'The database user lacks permission for this operation. Grant the required schema/table permissions or use the provider owner connection.'
    };
  }
  return {
    ...base,
    reason: 'unknown',
    hint: 'The database request failed. Check the Vercel function logs for the provider error.'
  };
}

function getLocalDatabase() {
  if (process.env.VERCEL === '1') {
    throw new Error('SQLite is available only for local development. Configure a Neon/Postgres URL on Vercel.');
  }
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
        date_of_birth DATE,
        mother_name TEXT,
        father_name TEXT,
        father_occupation TEXT,
        mother_occupation TEXT,
        gender TEXT
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
      CREATE TABLE IF NOT EXISTS classes (
        class_name TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        audience TEXT NOT NULL CHECK(audience IN ('students','teachers')),
        message_date DATE NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO classes(class_name)
        SELECT DISTINCT trim(class_name) FROM users
        WHERE role IN ('student','teacher') AND trim(coalesce(class_name,'')) <> '';
      CREATE INDEX IF NOT EXISTS users_role_name_idx ON users(role, lower(trim(name)));
      CREATE INDEX IF NOT EXISTS users_role_class_roll_idx ON users(role, class_name, roll_no, name);
      CREATE INDEX IF NOT EXISTS attendance_student_date_idx ON attendance(student_id, date);
    `);

    const userColumns = localDatabase.prepare('PRAGMA table_info(users)').all();
    const existingColumns = new Set(userColumns.map(column => column.name));
    for (const [name, type] of [
      ['date_of_birth', 'DATE'],
      ['mother_name', 'TEXT'],
      ['father_name', 'TEXT'],
      ['father_occupation', 'TEXT'],
      ['mother_occupation', 'TEXT'],
      ['gender', 'TEXT']
    ]) {
      if (!existingColumns.has(name)) {
        localDatabase.exec(`ALTER TABLE users ADD COLUMN ${name} ${type}`);
      }
    }
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

export const isLocalDatabase = () => !getDatabaseConfig().url && process.env.VERCEL !== '1';

export const sql = (strings, ...values) => {
  const config = getDatabaseConfig();
  if (config.url) {
    if (!config.valid) {
      throw Object.assign(new Error('The configured database URL is invalid.'), { code: 'INVALID_DATABASE_URL' });
    }
    if (!config.isNeonHost) {
      throw Object.assign(new Error('The configured URL host is not supported by the Neon serverless driver.'), {
        code: 'UNSUPPORTED_DATABASE_HOST'
      });
    }
    if (neonClientUrl !== config.url) {
      neonClient = neon(config.url);
      neonClientUrl = config.url;
    }
    return neonClient(strings, ...values);
  }
  if (process.env.VERCEL === '1') {
    throw Object.assign(new Error('A Neon/Postgres URL is required on Vercel; SQLite is local-only.'), {
      code: 'DATABASE_URL_MISSING'
    });
  }
  return runLocalQuery(strings, values);
};

const key = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(secret);
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
