'use client';

import { useEffect, useState } from 'react';

const api = async (path, body, method) => {
  let response;
  try {
    response = await fetch('/api/' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    return { error: 'Unable to reach the server. Check your connection and try again.' };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (response.status === 404) return { error: 'This API route was not found. Restart the app and check the deployment configuration.' };
    if (response.status >= 500) return { error: 'The server could not process this request. Check the server configuration and logs.' };
    return { error: `The server returned an unsupported response (HTTP ${response.status}). Please try again.` };
  }

  const result = await response.json().catch(() => null);
  if (!result || typeof result !== 'object') {
    return { error: `The server returned an invalid response (HTTP ${response.status}). Please try again.` };
  }
  if (!response.ok && !result.error) {
    return { error: `The request failed (HTTP ${response.status}). Please try again.` };
  }
  return result;
};

const today = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};
const NAME = { P: 'Present', A: 'Absent', L: 'Leave' };
const ROLE_TABS = {
  admin: ['Students', 'Teachers', 'Attendance', 'Holidays', 'Report'],
  teacher: ['Attendance'],
  student: ['My Attendance']
};
const QUOTES = [
  { arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', translation: 'My Lord, increase me in knowledge.', reference: 'Qur’an · 20:114' },
  { arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease.', reference: 'Qur’an · 94:5' },
  { arabic: 'وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ', translation: 'And Allah loves those who do good.', reference: 'Qur’an · 3:134' }
];
const TAB_ICON_PATHS = {
  Students: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  Teachers: <><path d="M12 7v14" /><path d="M3 18V5a2 2 0 0 1 2-2h5a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2Z" /><path d="M21 18V5a2 2 0 0 0-2-2h-5" /></>,
  Attendance: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  Holidays: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /><path d="M16 3v4m-2-2h4" /></>,
  Report: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
  'My Attendance': <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /><path d="m9 16 2 2 4-4" /></>
};

function Brand({ compact = false }) {
  return <div className="brand">
    <img src="/madrasa-logo.png" alt="Stech institution logo" />
    <div><span className="brand-name">Stech</span>
      {!compact && <span className="brand-sub">مدرسة المحمدية · Learning in faith</span>}
    </div>
  </div>;
}

function Message({ text, type = 'error' }) {
  return text ? <div className={`message ${type}`} role={type === 'error' ? 'alert' : 'status'}>{text}</div> : null;
}

function QuranQuote({ className = '', initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const quote = QUOTES[index];
  const next = () => setIndex(current => (current + 1) % QUOTES.length);

  return <section className={className} aria-label="Qur’an reflection">
    <div className="quran-verse" dir="rtl" lang="ar">{quote.arabic}</div>
    <div className="verse-translation">“{quote.translation}”</div>
    <div className="verse-controls">
      <div className="verse-reference">{quote.reference}</div>
      <div className="verse-dots" aria-label={`Reflection ${index + 1} of ${QUOTES.length}`}>
        {QUOTES.map((item, dotIndex) => <button key={item.reference} type="button"
          className={`verse-dot${dotIndex === index ? ' active' : ''}`}
          aria-label={`Show ${item.reference}`} aria-pressed={dotIndex === index}
          onClick={() => setIndex(dotIndex)} />)}
      </div>
      <button className="verse-next" type="button" onClick={next}>Next verse <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}

export default function Page() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installMessage, setInstallMessage] = useState('');
  const [installError, setInstallError] = useState('');
  const [installed, setInstalled] = useState(false);

  const loadSession = async () => {
    const health = await api('health');
    if (health.error) {
      setServiceError(health.error);
      setMe(null);
      setReady(true);
      return;
    }
    setServiceError('');
    const data = await api('me');
    setMe(data.error ? null : data);
    setReady(true);
  };

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
    }

    const captureInstallPrompt = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setInstallMessage('Stech has been installed on your device.');
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', markInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => {
          console.error('Stech could not register its service worker:', error);
          setInstallError('The install option is temporarily unavailable. You can still use this website normally.');
        });
    } else {
      setInstallError('App installation is not supported by this browser. You can still use this website normally.');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  if (!ready) return <div className="loading"><div><div className="spinner" />Preparing your portal…</div></div>;
  if (!me) return <Login onDone={loadSession} serviceError={serviceError}
    installPrompt={installPrompt} installMessage={installMessage} installError={installError}
    installed={installed} onInstalled={setInstalled} onInstallMessage={setInstallMessage} />;

  const tabs = ROLE_TABS[me.role] || [];
  const activeTab = tabs.includes(tab) ? tab : tabs[0];
  const logout = async () => {
    await api('logout', {});
    setMe(null);
    setTab('');
    setReady(true);
  };
  const pageTitles = {
    Students: ['Students', 'Manage student records and assigned classes.'],
    Teachers: ['Teachers', 'Manage teaching staff and class access.'],
    Attendance: ['Attendance', me.role === 'admin' ? 'Record and review attendance for any class.' : `Take attendance for ${me.cls || 'your class'}.`],
    Holidays: ['Holidays & leave', 'Manage days off for the whole institution.'],
    Report: ['Attendance reports', 'Review attendance totals and percentages.'],
    'My Attendance': ['My attendance', 'Your attendance record, progress, and institution holidays.']
  };
  const [heading, description] = pageTitles[activeTab] || ['Portal', ''];

  return <div className="app-shell">
    <header className="top-nav">
      <Brand />
      <div className="nav-right"><span className="secure-label"><span className="secure-dot" />Secure attendance portal</span></div>
    </header>
    <div className="portal-layout">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">Workspace</div>
        <nav className="side-nav" aria-label="Portal sections">
          {tabs.map(item => <TabButton key={item} item={item} active={item === activeTab} onClick={() => setTab(item)} />)}
        </nav>
        <div className="sidebar-foot"><strong className="arabic" dir="rtl">بِسْمِ اللَّهِ</strong>
          Attendance with care, learning with purpose.</div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-top">
          <div className="dashboard-heading"><h1>{heading}</h1><p>{description}</p></div>
          <div className="profile-pill">
            <div className="avatar">{me.name?.charAt(0)?.toUpperCase() || 'M'}</div>
            <div><div className="profile-name">{me.name}</div>
              <span className="profile-role">{me.role}{me.cls ? ` · ${me.cls}` : ''}</span></div>
            <button className="logout-button" onClick={logout}>Sign out</button>
          </div>
        </div>
        <nav className="mobile-tabs" aria-label="Portal sections">
          {tabs.map(item => <TabButton key={item} item={item} active={item === activeTab} onClick={() => setTab(item)} />)}
        </nav>
        <section className="hero-banner">
          <h2>{me.role === 'student' ? 'A journey of knowledge, guided by faith.' : 'Assalamu alaikum, ' + me.name}</h2>
          <p>{me.role === 'student'
            ? 'Keep track of your attendance and stay connected with your school calendar.'
            : 'A thoughtful space to support every learner, every day.'}</p>
          <img className="banner-mark" src="/madrasa-logo.png" alt="" aria-hidden="true" />
        </section>
        <QuranQuote className="dashboard-verse" initialIndex={1} />
        {activeTab === 'Students' && <Users role="student" />}
        {activeTab === 'Teachers' && <Users role="teacher" />}
        {activeTab === 'Attendance' && <Roster admin={me.role === 'admin'} teacherName={me.name} />}
        {activeTab === 'Holidays' && <Holidays />}
        {activeTab === 'Report' && <Report />}
        {activeTab === 'My Attendance' && <Mine />}
      </main>
    </div>
    <footer className="app-footer"><Brand compact /><span>© {new Date().getFullYear()} · A place to learn and grow</span></footer>
  </div>;
}

function TabButton({ item, active, onClick }) {
  return <button className={`nav-item${active ? ' active' : ''}`} onClick={onClick}>
    <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{TAB_ICON_PATHS[item]}</svg></span>{item}
  </button>;
}

function Login({ onDone, serviceError, installPrompt, installMessage, installError, installed, onInstalled, onInstallMessage }) {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', password: '', date_of_birth: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await api('login', { ...form, role });
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    await onDone();
  };
  const chooseRole = nextRole => {
    setRole(nextRole);
    setForm({ name: '', password: '', date_of_birth: '' });
    setError('');
  };
  const installApp = async () => {
    setError('');
    if (installed) return;
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          onInstallMessage('Finishing the Stech installation…');
        } else {
          onInstallMessage('Installation was canceled. You can install Stech whenever you’re ready.');
        }
        return;
      } catch (installFailure) {
        console.error('Stech installation prompt failed:', installFailure);
        onInstallMessage('The install prompt could not be opened. Try your browser’s menu instead.');
        return;
      }
    }

    const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    onInstallMessage(isAppleMobile
      ? 'To install Stech, tap Share in Safari, then choose “Add to Home Screen”.'
      : 'Open your browser menu and choose “Install app” or “Add to Home screen” to install Stech.');
  };

  return <div className="app-shell">
    <header className="top-nav"><Brand /><div className="nav-right"><span className="secure-label"><span className="secure-dot" />A welcoming place to learn</span></div></header>
    <main className="login-layout">
      <section className="welcome-panel">
        <img className="welcome-logo" src="/madrasa-logo.png" alt="Stech logo, featuring the Quran and crescent" />
        <span className="eyebrow">Knowledge · Character · Faith</span>
        <h1>Growing together in knowledge.</h1>
        <p>A calm, connected place for our school community to follow attendance and stay in touch with each school day.</p>
        <QuranQuote className="welcome-quote" />
      </section>
      <form className="login-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="intro">Choose your portal to continue securely.</p>
        <Message text={serviceError} type="warning" />
        <div className="role-picker" role="group" aria-label="Choose your portal">
          {['student', 'teacher', 'admin'].map(option =>
            <button type="button" key={option} className={`role-option${role === option ? ' active' : ''}`}
              aria-pressed={role === option} onClick={() => chooseRole(option)}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>)}
        </div>
        <Message text={error} />
        {role !== 'admin' && <label className="field">
          <span className="field-label">{role === 'student' ? 'Student name' : 'Teacher name'}</span>
          <input className="field-control" autoComplete="username" value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Enter your name" required />
        </label>}
        {role === 'student' ? <label className="field">
          <span className="field-label">Date of birth</span>
          <input className="field-control" type="date" autoComplete="bday" value={form.date_of_birth}
            onChange={event => setForm({ ...form, date_of_birth: event.target.value })} required />
        </label> : <label className="field">
          <span className="field-label">Password</span>
          <span className="password-wrap">
            <input className="field-control" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password" required />
            <button className="show-password" type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label>}
        <button className="primary-button login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Continue to portal'}</button>
        <div className="install-app-area">
          <button className="install-button" type="button" onClick={installApp} disabled={installed}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V3m0 12 4-4m-4 4-4-4" />
              <path d="M5 17v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
            </svg>
            {installed ? 'App installed' : 'Install Stech app'}
          </button>
          {installMessage && <p className="install-message" role="status">{installMessage}</p>}
          {installError && <p className="install-message install-error" role="status">{installError}</p>}
        </div>
        <p style={{ color: '#9299a8', fontSize: 11, lineHeight: 1.6, textAlign: 'center', margin: '15px 0 0' }}>
          {role === 'student' ? 'Use the date of birth registered by your administrator.' :
            role === 'teacher' ? 'Your administrator provides your sign-in password.' : 'Administrator access is protected.'}
        </p>
      </form>
    </main>
    <footer className="app-footer"><Brand compact /><span>© {new Date().getFullYear()} · A place to learn and grow</span></footer>
  </div>;
}

function Users({ role }) {
  const isStudent = role === 'student';
  const empty = { name: '', password: '', class_name: '', roll_no: '', date_of_birth: '' };
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    const result = await api('users?role=' + role);
    if (result.error) setError(result.error);
    else setList(result);
  };
  useEffect(() => { load(); }, [role]);

  const add = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    const result = await api('users', { ...form, role });
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm(empty);
    setMessage(`${isStudent ? 'Student' : 'Teacher'} added successfully.`);
    await load();
  };
  const remove = async id => {
    if (!window.confirm(`Remove this ${role}? Their attendance records will also be deleted.`)) return;
    const result = await api('users/' + id, null, 'DELETE');
    if (result.error) setError(result.error);
    else {
      setMessage(`${isStudent ? 'Student' : 'Teacher'} removed.`);
      await load();
    }
  };
  const update = key => event => setForm({ ...form, [key]: event.target.value });

  return <div className="content-grid">
    <section className="card">
      <div className="card-heading"><div><h2>Add {isStudent ? 'a student' : 'a teacher'}</h2>
        <p>{isStudent ? 'Set the student’s class and date of birth.' : 'Create a teacher account and assign a class.'}</p></div></div>
      <Message text={error} />
      <Message text={message} type="success" />
      <form onSubmit={add}>
        <label className="field"><span className="field-label">Full name</span>
          <input className="field-control" value={form.name} onChange={update('name')} placeholder="Name" required /></label>
        <label className="field"><span className="field-label">Class</span>
          <input className="field-control" value={form.class_name} onChange={update('class_name')} placeholder="e.g. 10-A" required /></label>
        {isStudent ? <>
          <label className="field"><span className="field-label">Date of birth · student password</span>
            <input className="field-control" type="date" value={form.date_of_birth} onChange={update('date_of_birth')} required /></label>
          <label className="field"><span className="field-label">Roll number <span style={{ color: '#9299a8', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
            <input className="field-control" value={form.roll_no} onChange={update('roll_no')} placeholder="Roll number" /></label>
        </> : <label className="field"><span className="field-label">Set teacher password</span>
          <span className="password-wrap"><input className="field-control" type={showPassword ? 'text' : 'password'}
            value={form.password} onChange={update('password')} placeholder="Temporary or chosen password" required />
            <button className="show-password" type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}</button></span></label>}
        <button className="primary-button" style={{ width: '100%' }}>Add {isStudent ? 'student' : 'teacher'}</button>
      </form>
    </section>
    <section className="card">
      <div className="card-heading"><div><h2>{isStudent ? 'Student' : 'Teacher'} directory</h2>
        <p>{list.length} {list.length === 1 ? 'record' : 'records'}</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Class</th>{isStudent && <th>Roll</th>}<th>Action</th></tr></thead>
        <tbody>{list.length ? list.map(user => <tr key={user.id}>
          <td>{user.name}</td><td>{user.class_name}</td>{isStudent && <td>{user.roll_no || '—'}</td>}
          <td><button className="danger-button" onClick={() => remove(user.id)} aria-label={`Remove ${user.name}`}>Remove</button></td>
        </tr>) : <tr><td className="table-empty" colSpan={isStudent ? 4 : 3}>No records yet. Add the first {isStudent ? 'student' : 'teacher'} above.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
}

function Roster({ admin, teacherName }) {
  const [className, setClassName] = useState('');
  const [activeClass, setActiveClass] = useState('');
  const [date, setDate] = useState(today());
  const [data, setData] = useState({ rows: [], holiday: null, locked: false, attendance_session: null });
  const [marks, setMarks] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const classPending = className.trim() !== activeClass;
  const isLocked = !admin && (date > today() || Boolean(data.holiday) || Boolean(data.locked));

  useEffect(() => {
    if (!activeClass.trim()) {
      setData({ rows: [], holiday: null, locked: false, attendance_session: null });
      setMarks({});
      return;
    }
    setData({ rows: [], holiday: null, locked: false, attendance_session: null });
    setMarks({});
    let active = true;
    api(`roster?cls=${encodeURIComponent(activeClass)}&date=${date}`).then(result => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setData({ rows: [], holiday: null, locked: false, attendance_session: null });
        return;
      }
      setError('');
      setData(result);
      setMarks(Object.fromEntries((result.rows || []).filter(student => student.status).map(student => [student.id, student.status])));
    });
    return () => { active = false; };
  }, [activeClass, date, admin]);
  const setAll = status => setMarks(Object.fromEntries(data.rows.map(student =>
    [student.id, !admin && student.status === 'L' ? 'L' : status])));
  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const records = data.rows.filter(student => marks[student.id] && (admin || student.status !== 'L'))
      .map(student => ({ student_id: student.id, status: marks[student.id] }));
    const result = await api('attendance', { date, class_name: activeClass, records });
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setData({
        ...data,
        attendance_session: admin ? data.attendance_session : { teacher_name: teacherName },
        rows: data.rows.map(student => ({ ...student, status: marks[student.id] || student.status }))
      });
      setMessage('Attendance saved successfully.');
    }
  };
  const options = admin ? ['P', 'A', 'L'] : ['P', 'A'];

  return <div className="content-grid">
    <section className="card full">
      <div className="card-heading"><div><h2>Class register</h2><p>{admin ? 'Choose any class and date to record attendance.' : 'Enter the class assigned to you, then mark Present or Absent.'}</p></div></div>
      <Message text={error} />
      <Message text={message} type="success" />
      <div className="toolbar">
        <label className="field"><span className="field-label">Class name</span>
          <input className="field-control compact" value={className} onChange={event => setClassName(event.target.value)}
            placeholder={admin ? 'e.g. Group A' : 'Enter your assigned class'} /></label>
        <label className="field"><span className="field-label">Attendance date</span>
          <input className="field-control compact" type="date" value={date} max={admin ? undefined : today()} onChange={event => setDate(event.target.value)} /></label>
        <button className="secondary-button" onClick={() => setActiveClass(className.trim())}
          disabled={!className.trim() || (!classPending && Boolean(data.rows.length))}>
          {admin ? 'Load class' : 'Load students'}
        </button>
        <button className="secondary-button" onClick={() => setAll('P')} disabled={!data.rows.length || isLocked || classPending}>All present</button>
      </div>
      {data.holiday && <div className="holiday-callout"><strong>{data.holiday.type === 'leave' ? 'Institution-wide leave' : 'School holiday'}:</strong> {data.holiday.title}{!admin && ' · attendance is locked'}</div>}
      {!admin && date > today() && <div className="holiday-callout">Future attendance cannot be recorded. Choose today or an earlier date.</div>}
      {data.locked && <div className="holiday-callout"><strong>Class register already submitted.</strong> {data.marked_by} submitted attendance for {activeClass} on {date}. This class is no longer available to other teachers for this date.</div>}
      {admin && data.attendance_session && <div className="holiday-callout"><strong>Submitted by:</strong> {data.attendance_session.teacher_name}</div>}
      <div className="table-wrap"><table><thead><tr><th>Roll</th><th>Student</th><th>Mark</th></tr></thead>
        <tbody>{data.rows.length && !classPending ? data.rows.map(student => <tr key={student.id}>
          <td>{student.roll_no || '—'}</td><td>{student.name}</td>
          <td><div className="mark-actions">{options.map(option => <button key={option}
            className={`mark-button${marks[student.id] === option ? ` selected-${option}` : ''}`}
            disabled={isLocked || (!admin && student.status === 'L')}
            onClick={() => setMarks({ ...marks, [student.id]: option })}>{option}</button>)}
            {!admin && student.status === 'L' && <span style={{ color: '#8b6a14', fontSize: 10, alignSelf: 'center' }}>Leave by admin</span>}
          </div></td>
        </tr>) : <tr><td className="table-empty" colSpan={3}>{classPending ? 'Enter the class name and load its register.' : data.locked ? 'This register is locked for other teachers on this date.' : 'No students found for this class.'}</td></tr>}</tbody>
      </table></div>
      <div className="attendance-footer"><span>{data.rows.length} {data.rows.length === 1 ? 'student' : 'students'}</span>
        {admin && data.attendance_session && <button className="secondary-button" onClick={() => {
          setClassName('');
          setActiveClass('');
        }}>Change class</button>}
        <button className="primary-button" onClick={save} disabled={!data.rows.length || isLocked || classPending || busy}>{busy ? 'Saving…' : 'Submit attendance'}</button></div>
    </section>
    {admin && <AttendanceSessions />}
  </div>;
}

function AttendanceSessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const load = async () => {
    const result = await api('attendance-sessions');
    if (result.error) setError(result.error);
    else {
      setError('');
      setSessions(result);
    }
  };
  useEffect(() => { load(); }, []);

  return <section className="card full">
    <div className="card-heading">
      <div><h2>Teacher attendance submissions</h2><p>Classes submitted by teachers, with the submission date and student count.</p></div>
      <button className="secondary-button" onClick={load}>Refresh</button>
    </div>
    <Message text={error} />
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Class</th><th>Submitted by</th><th>Students marked</th></tr></thead>
      <tbody>{sessions.length ? sessions.map((item, index) => <tr key={`${item.class_name}-${item.date}-${index}`}>
        <td>{item.date}</td><td><strong>{item.class_name}</strong></td><td>{item.teacher_name}</td><td>{item.student_count}</td>
      </tr>) : <tr><td className="table-empty" colSpan={4}>No teacher submissions yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}

function Holidays() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ date: today(), title: '', type: 'general' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = async () => {
    const result = await api('holidays');
    if (result.error) setError(result.error);
    else setList(result);
  };
  useEffect(() => { load(); }, []);
  const add = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    const result = await api('holidays', form);
    if (result.error) setError(result.error);
    else {
      setMessage('Holiday or leave added.');
      setForm({ ...form, title: '' });
      await load();
    }
  };
  const remove = async id => {
    const result = await api('holidays/' + id, null, 'DELETE');
    if (result.error) setError(result.error);
    else await load();
  };

  return <div className="content-grid">
    <section className="card">
      <div className="card-heading"><div><h2>Give a day off</h2><p>Applies to everyone in the institution.</p></div></div>
      <Message text={error} />
      <Message text={message} type="success" />
      <form onSubmit={add}>
        <label className="field"><span className="field-label">Date</span>
          <input className="field-control" type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></label>
        <label className="field"><span className="field-label">Title</span>
          <input className="field-control" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Eid holiday" required /></label>
        <label className="field"><span className="field-label">Day type</span>
          <select className="field-control" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>
            <option value="general">General holiday</option><option value="leave">Institution-wide leave</option>
          </select></label>
        <button className="primary-button" style={{ width: '100%' }}>Add to calendar</button>
      </form>
    </section>
    <section className="card">
      <div className="card-heading"><div><h2>School calendar</h2><p>{list.length} listed days</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Day off</th><th>Type</th><th></th></tr></thead>
        <tbody>{list.length ? list.map(holiday => <tr key={holiday.id}>
          <td>{holiday.date}</td><td>{holiday.title}</td><td>{holiday.type === 'leave' ? 'Leave' : 'Holiday'}</td>
          <td><button className="danger-button" onClick={() => remove(holiday.id)} aria-label={`Remove ${holiday.title}`}>Remove</button></td>
        </tr>) : <tr><td className="table-empty" colSpan={4}>No holidays added yet.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
}

function Report() {
  const [filters, setFilters] = useState({ cls: '', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const load = async () => {
    const result = await api(`report?cls=${encodeURIComponent(filters.cls)}&from=${filters.from}&to=${filters.to}`);
    if (result.error) setError(result.error);
    else {
      setError('');
      setRows(result);
    }
  };
  useEffect(() => { load(); }, []);
  return <section className="card full">
    <div className="card-heading"><div><h2>Attendance summary</h2><p>Leave days are shown separately and are not included in the attendance percentage.</p></div></div>
    <Message text={error} />
    <div className="toolbar">
      <input className="field-control compact" aria-label="Filter by class" placeholder="All classes" value={filters.cls}
        onChange={event => setFilters({ ...filters, cls: event.target.value })} />
      <label className="field"><span className="field-label">From</span><input className="field-control compact" type="date" value={filters.from}
        onChange={event => setFilters({ ...filters, from: event.target.value })} /></label>
      <label className="field"><span className="field-label">To</span><input className="field-control compact" type="date" value={filters.to}
        onChange={event => setFilters({ ...filters, to: event.target.value })} /></label>
      <button className="primary-button" onClick={load}>Show report</button>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Present</th><th>Absent</th><th>Leave</th><th>Attendance</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => {
        const total = row.p + row.a;
        const percentage = total ? Math.round(100 * row.p / total) : 0;
        return <tr key={row.id}><td>{row.name}</td><td>{row.class_name}</td><td>{row.p}</td><td>{row.a}</td><td>{row.l}</td>
          <td><strong style={{ color: 'var(--navy)' }}>{total ? `${percentage}%` : '—'}</strong></td></tr>;
      }) : <tr><td className="table-empty" colSpan={6}>No attendance records for this selection yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}

function Mine() {
  const [records, setRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('mine'), api('holidays')]).then(([attendance, calendar]) => {
      if (attendance.error || calendar.error) setError(attendance.error || calendar.error);
      else {
        setRecords(attendance);
        setHolidays(calendar);
      }
    });
  }, []);
  const count = status => records.filter(record => record.status === status).length;
  const total = count('P') + count('A');
  const percentage = total ? Math.round(100 * count('P') / total) : 0;

  return <>
    <Message text={error} />
    <div className="stat-grid">
      {[['Attendance', `${percentage}%`, `${total} marked days`], ['Present', count('P'), 'Days attended'],
        ['Absent', count('A'), 'Days absent'], ['Leave', count('L'), 'Days marked as leave']].map(([label, value, note]) =>
        <div className="stat-card" key={label}><span className="stat-label">{label}</span>
          <strong className="stat-value">{value}</strong><span className="stat-note">{note}</span>
          {label === 'Attendance' && <div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>}
        </div>)}
    </div>
    <div className="content-grid">
      <section className="card">
        <div className="card-heading"><div><h2>Attendance history</h2><p>Your recorded school days.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>{records.length ? records.map((record, index) => <tr key={`${record.date}-${index}`}>
            <td>{record.date}</td><td><span className={`status-badge status-${record.status}`}>{NAME[record.status]}</span></td>
          </tr>) : <tr><td className="table-empty" colSpan={2}>Your attendance history will appear here.</td></tr>}</tbody>
        </table></div>
      </section>
      <section className="card">
        <div className="card-heading"><div><h2>School holidays</h2><p>Institution-wide days off.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Day off</th></tr></thead>
          <tbody>{holidays.length ? holidays.map(holiday => <tr key={holiday.id}>
            <td>{holiday.date}</td><td>{holiday.title}<br /><span style={{ color: '#8b93a4', fontSize: 10 }}>{holiday.type === 'leave' ? 'Leave' : 'Holiday'}</span></td>
          </tr>) : <tr><td className="table-empty" colSpan={2}>No upcoming days off listed.</td></tr>}</tbody>
        </table></div>
      </section>
    </div>
  </>;
}
