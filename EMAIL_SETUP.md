Email configuration and Render deployment notes

This document explains how the backend sends email and what to configure when deploying to Render (or another host).

1) How mail is sent

- The app uses Nodemailer (SMTP) and can optionally use SendGrid (HTTP API) as a faster, more reliable path.
- Transport settings are taken from environment variables:
  - SMTP_HOST (e.g. smtp.gmail.com)
  - SMTP_PORT (e.g. 587)
  - SMTP_USER (your SMTP username / email)
  - SMTP_PASS (SMTP password or App Password)
  - EMAIL_FROM (optional; default: `WE TOO <noreply@wetoo.local>`)
  - SENDGRID_API_KEY (optional; if set, SendGrid is preferred)
    - ENABLE_ADMIN_ROUTES (optional; set to `true` to enable diagnostics routes)
    - MAIL_DIAG_TOKEN (required if admin routes enabled; a secret token you pass via header)

2) Important: do NOT store real credentials in the repository

- The `.env` file in the repo is for local development only. When deploying to Render, set the environment variables using the Render dashboard for your service.

3) Gmail specifics

- If you use Gmail (`smtp.gmail.com`):
  - Strongly prefer an App Password (requires enabling 2FA on your Google account). App Passwords are a short, stable credential that Nodemailer can use.
  - If your account does not support App Passwords and you try to use your regular Google password, Google will usually block the sign-in attempt.
  - Port: 587 (STARTTLS) or 465 (SSL)
  - Example Render environment variables:
    - SMTP_HOST=smtp.gmail.com
    - SMTP_PORT=587
    - SMTP_USER=your-email@gmail.com
    - SMTP_PASS=<your_app_password_here>

4) Common cause of ETIMEDOUT

- ETIMEDOUT typically means the backend could not open a TCP connection to the SMTP host/port.
  - Check that SMTP_HOST and SMTP_PORT are correct.
  - Ensure Render allows outbound connections to that host/port (Render typically allows outbound internet access, but double-check any private networking or firewall settings).
  - Confirm the SMTP host is reachable from Render (you can test using a simple remote TCP check or by temporarily deploying a small script to test connection).

5) Preferred option in production: Use an API-based email provider (SendGrid, Mailgun, Postmark)

- API-based providers avoid SMTP TCP issues and offer better deliverability and monitoring.
- This project includes built-in SendGrid support via `@sendgrid/mail`. If `SENDGRID_API_KEY` is set, emails are sent via HTTPS:443.

  - Render environment variables for SendGrid:
    - SENDGRID_API_KEY=<your_sendgrid_api_key>
    - EMAIL_FROM="WE TOO <verified-sender@yourdomain.com>" (must be a verified sender in SendGrid)
     - ENABLE_ADMIN_ROUTES=true (temporary, for diagnostics)
     - MAIL_DIAG_TOKEN=<choose-a-strong-random-token>

6) Quick checklist to fix the ETIMEDOUT you're seeing

- [ ] Preferred: Set SENDGRID_API_KEY on Render and a verified EMAIL_FROM; redeploy.
- [ ] Alternatively: On Render set the SMTP_* environment variables as above. If using Gmail, use an App Password.
- [ ] Ensure SMTP_PORT is 587 (or 465) and SMTP_HOST matches your provider.
- [ ] Redeploy the service on Render after setting env vars.

7) Debugging tips

- Temporarily enable debug (NODE_ENV!=production) to see Nodemailer logs (the code already sets debug when not in production).
- Add a small endpoint or script that calls transporter.verify() and returns the result for quick remote checks.
 - This project includes admin diagnostics routes (disabled by default). To enable:
   - Set ENABLE_ADMIN_ROUTES=true and MAIL_DIAG_TOKEN=your-secret on Render and redeploy.
   - Endpoints (prefix /api/admin):
     - GET /email-config (header: x-admin-token: <MAIL_DIAG_TOKEN>)
     - GET /email-verify (header: x-admin-token: <MAIL_DIAG_TOKEN>) — tests SMTP verify only
     - POST /email-test (header: x-admin-token: <MAIL_DIAG_TOKEN>, body: { to: "you@example.com" }) — sends a test email using the configured provider
   - Remember to set ENABLE_ADMIN_ROUTES back to false when done.

If you want, I can:
- Add a tiny endpoint to the backend to run `transporter.verify()` and return the status for easy remote testing (safe to enable temporarily).
- Add examples to the README with sample Render environment variable screenshots / CLI commands to set them.

