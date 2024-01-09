export const MAILPIT_URL = `http://${
  process.env["SMTP_HOST"] ?? "localhost"
}:8025`;
