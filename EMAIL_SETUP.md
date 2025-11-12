Email configuration and Render deployment notes

This document explains how the backend sends email and what to configure when deploying to Render (or another host).

1) How mail is sent

- The app uses Nodemailer. Transport is created in `src/utils/mailer.js`.
- Transport settings are taken from environment variables:
  - SMTP_HOST (e.g. smtp.gmail.com)
  - SMTP_PORT (e.g. 587)
  - SMTP_USER (your SMTP username / email)
  - SMTP_PASS (SMTP password or App Password)
  - EMAIL_FROM (optional; default: `WE TOO <noreply@wetoo.local>`)

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

5) Recommended alternative: Use an API-based email provider (SendGrid, Mailgun, Postmark)

- API-based providers avoid SMTP connection issues and offer better deliverability and monitoring.
- Example using SendGrid with Nodemailer (install `@sendgrid/mail` or use `nodemailer-sendgrid-transport`):

  - Using @sendgrid/mail directly (recommended):

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({ to, from: process.env.EMAIL_FROM, subject, text, html });

  - Using nodemailer with SendGrid transport:

    const nodemailer = require('nodemailer');
    const sgTransport = require('nodemailer-sendgrid-transport');
    const transporter = nodemailer.createTransport(sgTransport({ auth: { api_key: process.env.SENDGRID_API_KEY } }));

6) Quick checklist to fix the ETIMEDOUT you're seeing

- [ ] On Render: set the SMTP_* environment variables as above (do not copy credentials into the repo).
- [ ] If using Gmail, generate an App Password and use it as SMTP_PASS.
- [ ] Ensure SMTP_PORT is 587 (or 465) and SMTP_HOST matches your provider.
- [ ] Redeploy the service on Render after setting env vars.
- [ ] If issues persist, try switching to an API-based provider and set SENDGRID_API_KEY on Render.

7) Debugging tips

- Temporarily enable debug (NODE_ENV!=production) to see Nodemailer logs (the code already sets debug when not in production).
- Add a small endpoint or script that calls transporter.verify() and returns the result for quick remote checks.

If you want, I can:
- Add a tiny endpoint to the backend to run `transporter.verify()` and return the status for easy remote testing (safe to enable temporarily).
- Add examples to the README with sample Render environment variable screenshots / CLI commands to set them.

