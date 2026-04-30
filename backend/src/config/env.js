import dotenv from "dotenv";

dotenv.config();

export const env = {
  host: process.env.HOST || "0.0.0.0",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sante_aproxmite",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_secret",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: process.env.SMTP_PORT || "587",
  smtpSecure: process.env.SMTP_SECURE || "false",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",
  contactRecipient: process.env.CONTACT_RECIPIENT || "yefa.technologie@gmail.com",
};
