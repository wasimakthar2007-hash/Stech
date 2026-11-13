import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import {
  sql,
  setSession,
  getSession,
  clearSession,
  isLocalDatabase,
  getDatabaseConfig,
  describeDatabaseError
} from '../../../lib';

const J = (data, status = 200) => NextResponse.json(data, { status });
export const runtime = 'nodejs';
const environmentStatus = () => {
  const database = getDatabaseConfig();
  return {
    environment: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL?.trim()),
      POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL?.trim()),
      POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING?.trim()),
      JWT_SECRET: Boolean(process.env.JWT_SECRET?.trim()),
      SETUP_KEY: Boolean(process.env.SETUP_KEY?.trim())
    },
    databaseUrlSource: database.source,
    databaseHost: database.host,
    databaseUrlValid: database.valid,
    neonCompatibleHost: database.isNeonHost
  };
};
const validDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

async function ensureClassesTable() {
  await sql`create table if not exists classes(class_name text primary key)`;
  if (isLocalDatabase()) {
    await sql`insert or ignore into classes(class_name)
      select distinct trim(class_name) from users
      where role in ('student','teacher') and trim(coalesce(class_name,'')) <> ''`;
  } else {
    await sql`insert into classes(class_name)
      select distinct trim(class_name) from users
      where role in ('student','teacher') and trim(coalesce(class_name,'')) <> ''
      on conflict(class_name) do nothing`;
  }
}

async function handleRequest(req, { params }) {
  const [a, b] = params.path;
  const method = req.method;
  const body = method === 'POST' ? await req.json().catch(() => ({})) : {};
  const query = req.nextUrl.searchParams;

  if (a === 'setup' && method === 'POST') {
    if (!process.env.SETUP_KEY || body.key !== process.env.SETUP_KEY) return J({ error: 'Invalid setup key' }, 403);
    if (!process.env.ADMIN_PASSWORD) return J({ error: 'Configure ADMIN_PASSWORD on the server before setup' }, 500);
    if (process.env.VERCEL === '1' && !getDatabaseConfig().url) {
      return J({
        error: 'DATABASE_URL is missing in the Vercel server environment. Add a Neon PostgreSQL connection string in Project Settings → Environment Variables, select the deployment environment, save, and redeploy.',
        ...environmentStatus()
      }, 503);
    }

    await sql`create table if not exists users(
      id serial primary key,
      name text not null,
      email text unique,
      password_hash text not null,
      role text not null check(role in ('admin','teacher','student')),
      class_name text,
      roll_no text,
      date_of_birth date,
      mother_name text,
      father_name text,
      father_occupation text,
      mother_occupation text,
      gender text
    )`;
    if (!isLocalDatabase()) {
      await sql`alter table users add column if not exists date_of_birth date`;
      await sql`alter table users
        add column if not exists mother_name text,
        add column if not exists father_name text,
        add column if not exists father_occupation text,
        add column if not exists mother_occupation text,
        add column if not exists gender text`;
      await sql`alter table users alter column email drop not null`;
    }
    await sql`create table if not exists attendance(
      id serial primary key,
      student_id int references users(id) on delete cascade,
      date date not null,
      status text not null check(status in ('P','A','L')),
      marked_by int,
      unique(student_id,date)
    )`;
    await sql`create table if not exists holidays(
      id serial primary key,
      date date unique not null,
      title text,
      type text default 'general'
    )`;
    await ensureClassesTable();
    await sql`create table if not exists messages(
      id serial primary key,
      title text not null,
      content text not null,
      audience text not null check(audience in ('students','teachers')),
      message_date date not null,
      author_id int references users(id) on delete set null,
      created_at text not null default current_timestamp
    )`;
    if (isLocalDatabase()) {
      await sql`create table if not exists attendance_sessions(
        class_name text not null,
        date date not null,
        teacher_id int references users(id) on delete set null,
        marked_at text not null default current_timestamp,
        primary key(class_name,date)
      )`;
    } else {
      await sql`create table if not exists attendance_sessions(
        class_name text not null,
        date date not null,
        teacher_id int references users(id) on delete set null,
        marked_at timestamptz not null default now(),
        primary key(class_name,date)
      )`;
    }
    await sql`create index if not exists users_role_name_idx on users(role,lower(trim(name)))`;
    await sql`create index if not exists users_role_class_roll_idx on users(role,class_name,roll_no,name)`;
    await sql`create index if not exists attendance_student_date_idx on attendance(student_id,date)`;

    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const [existingAdmin] = await sql`select id from users where role='admin' order by id limit 1`;
    if (existingAdmin) {
      await sql`update users set password_hash=${hash} where id=${existingAdmin.id}`;
    } else {
      await sql`insert into users(name,password_hash,role) values('Admin',${hash},'admin')`;
    }
    return J({ ok: true });
  }

  if (a === 'login' && method === 'POST') {
    const role = body.role;
    if (!['admin', 'teacher', 'student'].includes(role)) return J({ error: 'Choose a valid portal' }, 400);
    const password = role === 'student' ? body.date_of_birth : body.password;
    if (!password) return J({ error: 'Enter your credentials' }, 400);

    let user;
    if (role === 'admin') {
      [user] = await sql`select * from users where role='admin' order by id limit 1`;
    } else {
      if (!body.name?.trim()) return J({ error: 'Enter your name' }, 400);
      const users = await sql`select * from users where role=${role} and lower(name)=lower(${body.name.trim()})`;
      for (const candidate of users) {
        if (await bcrypt.compare(password, candidate.password_hash)) {
          user = candidate;
          break;
        }
      }
    }
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return J({ error: 'Credentials not recognized' }, 401);
    await setSession(user);
    return J({ ok: true });
  }

  if (a === 'logout') {
    clearSession();
    return J({ ok: true });
  }

  const session = await getSession();
  if (!session) return J({ error: 'Login required' }, 401);
  const admin = session.role === 'admin';
  const teacher = session.role === 'teacher';
  if (a === 'me') return J(session);

  if (a === 'classes' && method === 'GET') {
    if (!admin && !teacher) return J({ error: 'Admin or teacher access required' }, 403);
    await ensureClassesTable();
    return J(await sql`select class_name from classes order by class_name`);
  }
  if (a === 'classes' && method === 'POST') {
    if (!admin) return J({ error: 'Admin only' }, 403);
    await ensureClassesTable();
    const className = body.class_name?.trim();
    if (!className || className.length > 80) {
      return J({ error: 'Enter a class name of 1 to 80 characters.' }, 400);
    }
    await sql`insert into classes(class_name) values(${className})
      on conflict(class_name) do nothing`;
    return J({ ok: true, class_name: className });
  }

  if (a === 'users') {
    if (!admin) return J({ error: 'Admin only' }, 403);
    if (method === 'GET') {
      const role = query.get('role');
      if (!['teacher', 'student'].includes(role)) return J({ error: 'Invalid role' }, 400);
      return role === 'student'
        ? J(await sql`select id,name,class_name,roll_no,mother_name,father_name,
            father_occupation,mother_occupation,gender from users
            where role=${role} order by class_name,roll_no,name`)
        : J(await sql`select id,name,class_name,roll_no from users
            where role=${role} order by class_name,roll_no,name`);
    }
    if (method === 'POST') {
      const { name, role, class_name, roll_no } = body;
      if (!name?.trim() || !['teacher', 'student'].includes(role) || !class_name?.trim()) {
        return J({ error: 'Name, role, and class are required' }, 400);
      }
      await ensureClassesTable();
      if (role === 'student') {
        if (!validDate(body.date_of_birth)) return J({ error: 'A valid date of birth is required' }, 400);
        if (body.gender && !['male', 'female'].includes(body.gender)) {
          return J({ error: 'Gender must be male or female' }, 400);
        }
        const [duplicate] = await sql`select id from users where role='student'
          and lower(name)=lower(${name.trim()}) and date_of_birth=${body.date_of_birth}::date`;
        if (duplicate) return J({ error: 'A student with this name and date of birth already exists' }, 409);
        const passwordHash = await bcrypt.hash(body.date_of_birth, 12);
        await sql`insert into users(name,password_hash,role,class_name,roll_no,date_of_birth,
            mother_name,father_name,father_occupation,mother_occupation,gender)
          values(${name.trim()},${passwordHash},'student',${class_name.trim()},${roll_no?.trim() || null},
            ${body.date_of_birth}::date,${body.mother_name?.trim() || null},${body.father_name?.trim() || null},
            ${body.father_occupation?.trim() || null},${body.mother_occupation?.trim() || null},
            ${body.gender || null})`;
        await sql`insert into classes(class_name) values(${class_name.trim()})
          on conflict(class_name) do nothing`;
      } else {
        if (!body.password?.trim()) return J({ error: 'Set a password for the teacher' }, 400);
        const passwordHash = await bcrypt.hash(body.password, 12);
        await sql`insert into users(name,password_hash,role,class_name)
          values(${name.trim()},${passwordHash},'teacher',${class_name.trim()})`;
        await sql`insert into classes(class_name) values(${class_name.trim()})
          on conflict(class_name) do nothing`;
      }
      return J({ ok: true });
    }
    if (method === 'DELETE') {
      await sql`delete from users where id=${b} and role in ('teacher','student')`;
      return J({ ok: true });
    }
  }

  if (a === 'messages') {
    if (method === 'GET') {
      const rows = isLocalDatabase()
        ? await sql`select m.id,m.title,m.content,m.audience,m.message_date,
            m.author_id,m.created_at,coalesce(u.name,'Former staff member') author_name
          from messages m left join users u on u.id=m.author_id
          where (${admin} or (${teacher} and (m.audience='teachers' or m.author_id=${session.id}))
            or (${session.role === 'student'} and m.audience='students'))
          order by m.message_date desc,m.created_at desc,m.id desc`
        : await sql`select m.id,m.title,m.content,m.audience,
            to_char(m.message_date,'YYYY-MM-DD') message_date,
            m.author_id,m.created_at,coalesce(u.name,'Former staff member') author_name
          from messages m left join users u on u.id=m.author_id
          where (${admin} or (${teacher} and (m.audience='teachers' or m.author_id=${session.id}))
            or (${session.role === 'student'} and m.audience='students'))
          order by m.message_date desc,m.created_at desc,m.id desc`;
      return J(rows);
    }
    if (method === 'POST') {
      if (!admin && !teacher) return J({ error: 'Only administrators and teachers can send messages.' }, 403);
      const title = body.title?.trim();
      const content = body.content?.trim();
      const audience = admin ? body.audience : 'students';
      if (!title || title.length > 120 || !content || content.length > 5000) {
        return J({ error: 'Enter a title (up to 120 characters) and message (up to 5000 characters).' }, 400);
      }
      if (!['students', 'teachers'].includes(audience)) {
        return J({ error: 'Choose students or teachers as the message audience.' }, 400);
      }
      if (teacher && audience !== 'students') {
        return J({ error: 'Teachers can only send messages to students.' }, 403);
      }
      if (!validDate(body.message_date)) return J({ error: 'Choose a valid message date.' }, 400);
      const [created] = await sql`insert into messages(title,content,audience,message_date,author_id)
        values(${title},${content},${audience},${body.message_date}::date,${session.id})
        returning id`;
      return J({ ok: true, id: created.id });
    }
    if (method === 'DELETE') {
      if (!admin) return J({ error: 'Only administrators can delete messages.' }, 403);
      if (!/^\d+$/.test(b || '')) return J({ error: 'Invalid message.' }, 400);
      await sql`delete from messages where id=${Number(b)}`;
      return J({ ok: true });
    }
  }

  if (a === 'holidays') {
    if (method === 'GET') return J(await sql`select id,to_char(date,'YYYY-MM-DD') date,title,type from holidays order by date desc`);
    if (!admin) return J({ error: 'Admin only' }, 403);
    if (method === 'POST') {
      if (!validDate(body.date) || !body.title?.trim()) return J({ error: 'A valid date and title are required' }, 400);
      const type = body.type === 'leave' ? 'leave' : 'general';
      await sql`insert into holidays(date,title,type) values(${body.date}::date,${body.title.trim()},${type})
        on conflict(date) do update set title=excluded.title,type=excluded.type`;
      return J({ ok: true });
    }
    if (method === 'DELETE') {
      await sql`delete from holidays where id=${b}`;
      return J({ ok: true });
    }
  }

  if (a === 'roster' && method === 'GET' && session.role !== 'student') {
    const requestedClass = (query.get('cls') || '').trim();
    const date = query.get('date');
    if (!validDate(date)) return J({ error: 'A valid date is required' }, 400);
    let className = requestedClass;
    if (teacher) {
      const [day] = await sql`select (${date}::date = current_date) as today`;
      if (!day?.today) return J({ error: 'Teachers can only view attendance for today.' }, 400);
      await ensureClassesTable();
      const [registeredClass] = await sql`select class_name from classes
        where lower(class_name)=lower(${requestedClass}) limit 1`;
      if (!registeredClass) return J({ error: 'Choose a class registered by the administrator.' }, 400);
      className = registeredClass.class_name;
    }
    const [attendanceSession] = await sql`select s.teacher_id,t.name teacher_name,s.marked_at
      from attendance_sessions s left join users t on t.id=s.teacher_id
      where s.class_name=${className} and s.date=${date}::date`;
    if (!admin && attendanceSession && Number(attendanceSession.teacher_id) !== Number(session.id)) {
      return J({
        rows: [],
        holiday: null,
        cls: className,
        locked: true,
        marked_by: attendanceSession.teacher_name || 'A teacher whose account is no longer active'
      });
    }
    const rows = await sql`select u.id,u.name,u.roll_no,a.status from users u
      left join attendance a on a.student_id=u.id and a.date=${date}::date
      where u.role='student' and u.class_name=${className} order by u.roll_no,u.name`;
    const [holiday] = await sql`select title,type from holidays where date=${date}::date`;
    return J({
      rows,
      holiday: holiday || null,
      cls: className,
      attendance_session: attendanceSession ? {
        teacher_name: attendanceSession.teacher_name || 'A teacher whose account is no longer active',
        marked_at: attendanceSession.marked_at
      } : null
    });
  }

  if (a === 'attendance-sessions' && method === 'GET') {
    if (!admin) return J({ error: 'Admin only' }, 403);
    const rows = isLocalDatabase()
      ? await sql`select s.class_name,strftime('%Y-%m-%d',s.date) date,
          coalesce(t.name,'Former teacher') teacher_name,s.marked_at,
          count(student.id)::int student_count
        from attendance_sessions s left join users t on t.id=s.teacher_id
        left join attendance a on a.date=s.date
        left join users student on student.id=a.student_id and student.role='student'
          and student.class_name=s.class_name
        group by s.class_name,s.date,t.name,s.marked_at
        order by s.date desc,s.class_name limit 200`
      : await sql`select s.class_name,to_char(s.date,'YYYY-MM-DD') date,
          coalesce(t.name,'Former teacher') teacher_name,s.marked_at,
          count(student.id)::int student_count
        from attendance_sessions s left join users t on t.id=s.teacher_id
        left join attendance a on a.date=s.date
        left join users student on student.id=a.student_id and student.role='student'
          and student.class_name=s.class_name
        group by s.class_name,s.date,t.name,s.marked_at
        order by s.date desc,s.class_name limit 200`;
    return J(rows);
  }

  if (a === 'attendance' && method === 'POST' && session.role !== 'student') {
    const { date, records } = body;
    const requestedClass = (body.class_name || '').trim();
    if (!validDate(date) || !Array.isArray(records)) return J({ error: 'A valid date and attendance records are required' }, 400);
    const allowedStatuses = admin ? ['P', 'A', 'L'] : ['P', 'A'];
    if (records.some(record => !record || !Number.isInteger(Number(record.student_id)) ||
      Number(record.student_id) < 1 || !allowedStatuses.includes(record.status))) {
      return J({ error: 'Each attendance record must include a valid student and status' }, 400);
    }
    let className = requestedClass;
    if (teacher) {
      await ensureClassesTable();
      const [registeredClass] = await sql`select class_name from classes
        where lower(class_name)=lower(${requestedClass}) limit 1`;
      if (!registeredClass) return J({ error: 'Choose a class registered by the administrator.' }, 400);
      className = registeredClass.class_name;
    }
    const [checks] = await sql`select (${date}::date = current_date) today,
      exists(select 1 from holidays where date=${date}::date) holiday`;
    if (!admin && !checks.today) return J({ error: 'Teachers can only mark attendance for today.' }, 400);
    if (!admin && checks.holiday) return J({ error: 'Attendance is locked for this holiday or leave' }, 400);
    if (!admin) {
      if (records.length === 0) return J({ error: 'Mark at least one student before submitting attendance.' }, 400);
      await sql`insert into attendance_sessions(class_name,date,teacher_id)
        values(${className},${date}::date,${session.id})
        on conflict(class_name,date) do nothing`;
      const [owner] = await sql`select s.teacher_id,t.name teacher_name
        from attendance_sessions s left join users t on t.id=s.teacher_id
        where s.class_name=${className} and s.date=${date}::date`;
      if (!owner || Number(owner.teacher_id) !== Number(session.id)) {
        return J({
          error: `Attendance for ${className} on ${date} has already been submitted by ${owner?.teacher_name || 'another teacher'}.`
        }, 409);
      }
    }
    await Promise.all(records.map(record => {
      const status = record.status;
      return sql`insert into attendance(student_id,date,status,marked_by)
        select id,${date}::date,${status},${session.id} from users
        where id=${record.student_id} and role='student' and (${admin} or class_name=${className})
        on conflict(student_id,date) do update set status=excluded.status,marked_by=excluded.marked_by
        where ${admin} or attendance.status<>'L'`;
    }));
    return J({ ok: true });
  }

  if (a === 'report' && admin) {
    const className = query.get('cls') || '';
    const from = query.get('from') || '2000-01-01';
    const to = query.get('to') || '2999-01-01';
    return J(await sql`select u.id,u.name,u.class_name,u.roll_no,
      count(a.id) filter(where a.status='P')::int p,
      count(a.id) filter(where a.status='A')::int a,
      count(a.id) filter(where a.status='L')::int l
      from users u left join attendance a on a.student_id=u.id and a.date between ${from}::date and ${to}::date
      where u.role='student' and (${className}='' or u.class_name=${className})
      group by u.id order by u.class_name,u.roll_no,u.name`);
  }

  if (a === 'mine' && session.role === 'student') {
    return J(await sql`select to_char(date,'YYYY-MM-DD') date,status from attendance
      where student_id=${session.id} order by date desc`);
  }

  return J({ error: 'Not found' }, 404);
}

async function handle(req, context) {
  try {
    return await handleRequest(req, context);
  } catch (error) {
    const database = getDatabaseConfig();
    const databaseError = describeDatabaseError(error);
    console.error('Attendance API request failed:', {
      code: databaseError.code,
      reason: databaseError.reason,
      source: database.source,
      host: database.host
    });
    if (process.env.VERCEL === '1' && !database.url) {
      return J({
        error: 'DATABASE_URL is missing in the Vercel server environment. Add a Neon PostgreSQL connection string in Project Settings → Environment Variables, select the deployment environment, save, and redeploy.',
        ...environmentStatus()
      }, 503);
    }
    if (!process.env.JWT_SECRET?.trim()) {
      return J({ error: 'Session security is not configured. Add JWT_SECRET to the server environment and restart the app.' }, 503);
    }
    if (databaseError.reason !== 'unknown') {
      return J({
        error: databaseError.hint,
        database: {
          reason: databaseError.reason,
          code: databaseError.code,
          source: databaseError.source,
          host: databaseError.host
        }
      }, 503);
    }
    return J({ error: 'The server could not complete this request. Check the database connection and server logs, then try again.' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
