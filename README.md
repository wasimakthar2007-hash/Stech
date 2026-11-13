# Stech Attendance Portal

A responsive attendance portal built with Next.js, Node.js API routes, and SQL. Local development uses a persistent SQLite database; Vercel deployments require Neon/Postgres. The Neon serverless driver only supports Neon database hosts. The institution crest is used as the Stech app logo from `public/madrasa-logo.png` without modification.

## Run locally

1. Use Node.js 22.5 or later.
2. Copy `.env.example` to `.env.local`.
3. Set a long random `JWT_SECRET` and your chosen `ADMIN_PASSWORD` in `.env.local`. Keep these values private and out of source control.
4. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

The local database is created automatically at `data/attendance.sqlite`, and the first administrator account is initialized from `ADMIN_PASSWORD` on first run. The database file is local and is ignored by Git.

## Install Stech

Open the login page in a supported browser and select **Install Stech app**. If the browser does not show an install prompt, open its menu and choose **Install app** or **Add to Home screen**. On iPhone or iPad, open the page in Safari, tap **Share**, then choose **Add to Home Screen**. The app can show an offline notice when there is no connection; attendance and sign-in still require the server.

## Hosted deployment

For a hosted deployment, configure a persistent Neon/Postgres connection in the hosting provider's server environment. Set `DATABASE_URL`, or use the Vercel Postgres `POSTGRES_URL` variable; the app also recognizes `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`. Set `JWT_SECRET`, `ADMIN_PASSWORD`, and `SETUP_KEY` as well. Attach a Postgres database integration to the same Vercel project or copy its connection URL into one of these variables, enable it for Production and any other deployed environments, and redeploy after changing variables. Do not use SQLite on Vercel because serverless filesystem storage is not persistent. Deploy the app, then initialize the database:

```powershell
$setupKey = Read-Host "Vercel SETUP_KEY"
$body = @{ key = $setupKey } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-APP.example.com/api/setup" `
  -ContentType "application/json" `
  -Body $body
Remove-Variable setupKey, body
```

The setup endpoint creates the SQL tables and stores a hash of the server-configured administrator password. Re-running setup with the setup key updates the first administrator's password to the configured value and applies new attendance tables. Do not use the local SQLite file as persistent storage on serverless hosting.

Check the deployment configuration at `https://YOUR-APP.example.com/api/health`. It runs `select 1`, checks schema readiness, and returns a sanitized `databaseError` reason/hint and connection host (never the URL or credentials). The `environment` object reports only whether variables are present, and `database.source` identifies which variable name was selected. Vercel must use a supported Neon/Postgres URL; SQLite is local-only. If the URL is present but unreachable, use the health reason and Vercel Function logs to check the URL, credentials, Neon project/compute state, or permissions.

## Sign-in

- **Admin:** Select Admin and enter the server-configured administrator password.
- **Teacher:** Select Teacher and enter the name and password assigned by the administrator.
- **Student:** Select Student and enter the registered name and date of birth.
- Email is not used for sign-in. Student names must be distinct for students sharing the same date of birth.

## Portals and permissions

- **Admin:** Add or remove students and teachers; record Present, Absent, or Leave for any class; manage institution-wide holidays/leave; view attendance counts and percentages.
- **Teacher:** Select any registered class to load its student roster, then record Present or Absent for today. After one teacher submits, that class is locked for that date. Institution holidays are locked, and admin-marked Leave cannot be changed.
- **Student:** View their own attendance totals, percentage, history, holiday list, and student announcements.
- **Messages:** Administrators can publish announcements for students or teachers and delete them; teachers can publish announcements for students. Students can view announcements but cannot edit or delete them. Messages are grouped by their selected date, newest first.

The admin attendance portal lists teacher submissions by date, class, teacher, and number of students marked. The application enforces class assignment and duplicate-submission rules in its Node API as well as in the interface.
