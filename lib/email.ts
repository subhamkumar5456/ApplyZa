import nodemailer from 'nodemailer'
import { env } from '@/lib/env';

// Validate env variables
if (!env.SMTP_USER || !env.SMTP_PASS) {
  throw new Error('Missing SMTP_USER or SMTP_PASS in environment variables');
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}