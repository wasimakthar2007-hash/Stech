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

### Vercel deployment checklist

1. Import `wasimakthar2007-hash/Stech` into Vercel. Set the project **Root Directory** to `./` (the repository root containing `package.json`) and the framework preset to **Next.js**. The build command is `npm run build`.
2. Create or select a **Neon** PostgreSQL database. This project uses `@neondatabase/serverless`, which requires a Neon host; other PostgreSQL providers are not supported by this driver. Copy the provider's PostgreSQL connection string. It should look like `postgresql://USER:PASSWORD@ep-example.region.aws.neon.tech/DATABASE?sslmode=require`. Keep the actual URL private.
3. In **Project → Settings → Environment Variables**, add these server-only variables (do not prefix them with `NEXT_PUBLIC_`):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string from step 2 |
   | `JWT_SECRET` | A new, long, random secret |
   | `ADMIN_PASSWORD` | A private admin password you choose |
   | `SETUP_KEY` | A separate, random one-time setup key |

   Select every environment where you will deploy (at least **Production**; also **Preview** if testing preview deployments), save the variables, and redeploy. Vercel does not add newly saved values to deployments that are already running. The app also recognizes `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, and `POSTGRES_URL_NON_POOLING`, but setting `DATABASE_URL` explicitly is recommended.
4. Open `https://YOUR-DEPLOYMENT.vercel.app/api/health`. Before setup, it may report that attendance tables or the admin account are not initialized. Confirm `DATABASE_URL` is present and the Neon connection succeeds before proceeding. The endpoint reports only variable presence, database host, and sanitized diagnostics; it never returns secrets.
5. Initialize the schema and admin account once using the setup endpoint. In PowerShell, enter the actual deployment URL when prompted and enter the `SETUP_KEY` privately:

```powershell
$setupKey = Read-Host "Vercel SETUP_KEY"
$body = @{ key = $setupKey } | ConvertTo-Json
$appUrl = Read-Host "Vercel deployment URL (for example https://your-app.vercel.app)"
Invoke-RestMethod -Method Post `
  -Uri "$($appUrl.TrimEnd('/'))/api/setup" `
  -ContentType "application/json" `
  -Body $body
Remove-Variable setupKey, body, appUrl
```

The setup endpoint creates the SQL tables and stores a hash of the server-configured administrator password. Re-running setup updates the first administrator's password to the currently configured `ADMIN_PASSWORD`; do not rerun it unless you intend to change the admin password. Do not use the local SQLite file as persistent storage on serverless hosting.

After setup, reload `/api/health`; it should return `"ready": true`. If sign-in says it cannot reach the server, first open `/api/health` in the same deployment: a JSON response shows the exact database/configuration problem, while an unavailable health route points to a deployment or routing issue. If a database URL is missing, add `DATABASE_URL` to the correct Vercel project and environment, save, then create a new deployment. If the URL is present but connection fails, use the sanitized health reason and Vercel Function logs to check its host, credentials, Neon project status, and permissions. Do not use SQLite on Vercel because serverless filesystem storage is not persistent.

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
