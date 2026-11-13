import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import {
  describeDatabaseError,
  getDatabaseConfig,
  isLocalDatabase,
  sql
} from '../../../lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const response = (data, status = 200) => NextResponse.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store, max-age=0' }
});
const databaseBoolean = value => value === true || value === 't' || value === 1 || value === '1';

function environmentStatus() {
  const database = getDatabaseConfig();
  return {
    environment: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL?.trim()),
      POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL?.trim()),
      POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING?.trim()),
      JWT_SECRET: Boolean(process.env.JWT_SECRET?.trim()),
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
      SETUP_KEY: Boolean(process.env.SETUP_KEY?.trim())
    },
    database: {
      mode: isLocalDatabase() ? 'local-sqlite' : 'postgres',
      source: database.source,
      host: database.host,
      urlValid: database.url ? database.valid : null,
      neonCompatibleHost: database.url ? database.isNeonHost : null
    }
  };
}

export async function GET() {
  const diagnostics = environmentStatus();
  const config = getDatabaseConfig();

  if (process.env.VERCEL === '1' && !config.url) {
    const databaseError = describeDatabaseError(
      Object.assign(new Error('Database URL is not configured.'), { code: 'DATABASE_URL_MISSING' })
    );
    return response({
      ready: false,
      error: 'DATABASE_URL is missing in the Vercel server environment. Add a Neon PostgreSQL connection string in Project Settings → Environment Variables, select the deployment environment, save, and redeploy.',
      databaseError,
      ...diagnostics
    }, 503);
  }

  try {
    if (!process.env.JWT_SECRET?.trim()) {
      return response({
        ready: false,
        error: 'Configure JWT_SECRET in the server environment before enabling sign-in.',
        database: diagnostics.database,
        environment: diagnostics.environment
      }, 503);
    }

    const [tables] = isLocalDatabase()
      ? await sql`select 1 as database_connected,
        exists(select 1 from sqlite_master where type='table' and name='users') as users_ready,
        exists(select 1 from sqlite_master where type='table' and name='attendance') as attendance_ready,
        exists(select 1 from sqlite_master where type='table' and name='holidays') as holidays_ready,
        exists(select 1 from sqlite_master where type='table' and name='attendance_sessions') as sessions_ready,
        exists(select 1 from sqlite_master where type='table' and name='classes') as classes_ready,
        exists(select 1 from sqlite_master where type='table' and name='messages') as messages_ready`
      : await sql`select 1 as database_connected,
        to_regclass('users') is not null as users_ready,
        to_regclass('attendance') is not null as attendance_ready,
        to_regclass('holidays') is not null as holidays_ready,
        to_regclass('attendance_sessions') is not null as sessions_ready,
        to_regclass('classes') is not null as classes_ready,
        to_regclass('messages') is not null as messages_ready`;

    if (!databaseBoolean(tables?.database_connected)) {
      return response({
        ready: false, error: 'The database connection test did not return the expected result.',
        database: diagnostics.database,
        environment: diagnostics.environment
      }, 503);
    }

    const requiredTables = [
      ['users', tables?.users_ready],
      ['attendance', tables?.attendance_ready],
      ['holidays', tables?.holidays_ready],
      ['attendance_sessions', tables?.sessions_ready],
      ['classes', tables?.classes_ready],
      ['messages', tables?.messages_ready]
    ];
    const missingTables = requiredTables
      .filter(([, exists]) => !databaseBoolean(exists))
      .map(([name]) => name);
    if (missingTables.length) {
      return response({
        ready: false,
        error: `Database is connected, but these application tables are missing: ${missingTables.join(', ')}. Configure SETUP_KEY and ADMIN_PASSWORD, then run POST /api/setup.`,
        missingTables,
        database: { ...diagnostics.database, connected: true },
        environment: diagnostics.environment
      }, 503);
    }

    const [admin] = await sql`select exists(select 1 from users where role='admin') as ready`;
    if (!admin?.ready) {
      if (isLocalDatabase() && process.env.ADMIN_PASSWORD) {
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        await sql`insert into users(name,password_hash,role) values('Admin',${passwordHash},'admin')`;
      } else {
        return response({
          ready: false,
          error: 'The administrator account has not been initialized. Configure ADMIN_PASSWORD and run POST /api/setup.',
          database: { ...diagnostics.database, connected: true },
          environment: diagnostics.environment
        }, 503);
      }
    }

    return response({
      ready: true,
      database: { ...diagnostics.database, connected: true, schemaReady: true },
      environment: diagnostics.environment
    });
  } catch (error) {
    const databaseError = describeDatabaseError(error);
    console.error('Database health check failed:', databaseError);
    return response({
      ready: false,
      error: databaseError.hint,
      databaseError,
      ...diagnostics
    }, 503);
  }
}
