import nodemailer from 'nodemailer'
import type { PreparedMail } from '../types/rental'

const toBoolean = (value: string | undefined): boolean => value === 'true' || value === '1'

export type MailResult =
  | { mode: 'prepared'; preview: PreparedMail }
  | { mode: 'sent'; messageId: string }

export const buildRequestMail = (args: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  message?: string
  productTitle: string
  productArticleNumber: string
  rentalDays: number
  rentalStart?: string
  rentalEnd?: string
  totalWithDeposit: number
}): PreparedMail => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    message,
    productTitle,
    productArticleNumber,
    rentalDays,
    rentalStart,
    rentalEnd,
    totalWithDeposit,
  } = args

  const subject = `Neue Mietanfrage: ${productTitle} (${productArticleNumber})`
  const lines = [
    'Neue Anfrage ueber den Anfrage-Checkout',
    '',
    `Produkt: ${productTitle} (${productArticleNumber})`,
    `Mietdauer: ${rentalDays} Tag(e)`,
    rentalStart ? `Mietbeginn: ${rentalStart}` : 'Mietbeginn: nicht angegeben',
    rentalEnd ? `Mietende: ${rentalEnd}` : 'Mietende: nicht angegeben',
    `Gesamt (inkl. Kaution): EUR ${totalWithDeposit.toFixed(2)}`,
    '',
    `Name: ${customerName}`,
    `E-Mail: ${customerEmail}`,
    `Telefon: ${customerPhone || 'nicht angegeben'}`,
    '',
    'Nachricht:',
    message || '-',
  ]

  const text = lines.join('\n')

  return {
    to: process.env.REQUEST_NOTIFICATION_EMAIL || 'office@allessaniert.at',
    subject,
    text,
  }
}

export const sendRequestNotification = async (mail: PreparedMail): Promise<MailResult> => {
  const shouldSend = toBoolean(process.env.ENABLE_EMAIL_SENDING)

  if (!shouldSend) {
    return {
      mode: 'prepared',
      preview: mail,
    }
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 25)

  if (!host || !Number.isFinite(port)) {
    throw new Error('SMTP-Konfiguration unvollstaendig. Bitte SMTP_HOST und SMTP_PORT setzen.')
  }

  const secure = toBoolean(process.env.SMTP_SECURE)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })

  const sender = process.env.SMTP_USER || process.env.REQUEST_NOTIFICATION_EMAIL || 'noreply@example.com'

  const info = await transporter.sendMail({
    from: sender,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  })

  return {
    mode: 'sent',
    messageId: info.messageId,
  }
}
