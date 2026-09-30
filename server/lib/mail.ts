/**
 * Outgoing email. No mail provider is configured yet, so messages are
 * written to the server log and `false` is returned. Plug in an SMTP / API
 * provider here (e.g. nodemailer with ENV.smtpUrl, SES, SendGrid) and return
 * true once the message is accepted.
 */
import { ENV } from '../env';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  if (ENV.smtpUrl) {
    // TODO: send through the configured provider.
  }
  console.info(`\n[mail:not-sent] To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
  return false;
}
