# Stech Attendance Portal

A responsive attendance portal built with Next.js, Node.js API routes, and SQL. Local development uses a persistent SQLite database; hosted deployments can use Neon/Postgres by setting `DATABASE_URL`. The institution crest is used as the Stech app logo from `public/madrasa-logo.png` without modification.

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

For a hosted deployment, configure a persistent Neon/Postgres connection with `DATABASE_URL`, plus `JWT_SECRET`, `ADMIN_PASSWORD`, and `SETUP_KEY` in the hosting provider's server environment. Deploy the app, then initialize the database:

```sh
curl -X POST https://YOUR-APP.example.com/api/setup \
  -H "content-type: application/json" \
  -d '{"key":"YOUR_SETUP_KEY"}'
```

The setup endpoint creates the SQL tables and stores a hash of the server-configured administrator password. Re-running setup with the setup key updates the first administrator's password to the configured value and applies new attendance tables. Do not use the local SQLite file as persistent storage on serverless hosting.

Check the deployment configuration at `https://YOUR-APP.example.com/api/health`. Its `environment` object only reports whether `DATABASE_URL`, `JWT_SECRET`, and `SETUP_KEY` are present; it never returns their values. If Vercel reports `JWT_SECRET: false`, add a non-empty `JWT_SECRET` under the correct Vercel project and the environments being deployed, then create a new deployment so the serverless functions receive it. Do not prefix it with `NEXT_PUBLIC_`. Vercel deployments also require a persistent hosted database configured with `DATABASE_URL`.

## Sign-in

- **Admin:** Select Admin and enter the server-configured administrator password.
- **Teacher:** Select Teacher and enter the name and password assigned by the administrator.
- **Student:** Select Student and enter the registered name and date of birth.
- Email is not used for sign-in. Student names must be distinct for students sharing the same date of birth.

## Portals and permissions

- **Admin:** Add or remove students and teachers; record Present, Absent, or Leave for any class; manage institution-wide holidays/leave; view attendance counts and percentages.
- **Teacher:** Enter the class assigned by the administrator to load its student roster, then record Present or Absent. After one teacher submits, that class is hidden from other teachers for that date; the submitting teacher can reopen it. Future dates and institution holidays are locked, and admin-marked Leave cannot be changed.
- **Student:** View their own attendance totals, percentage, history, and the holiday list.

The admin attendance portal lists teacher submissions by date, class, teacher, and number of students marked. The application enforces class assignment and duplicate-submission rules in its Node API as well as in the interface.
