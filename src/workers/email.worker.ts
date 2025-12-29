// src/workers/email.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { env } from '../core/config/env';
import { logger } from '../core/logger';
import Redis from 'ioredis';

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export function createEmailWorker(prisma: PrismaClient) {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: env.SMTP_USER ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
  });

  const worker = new Worker(
    'email-queue',
    async (job: Job<EmailJob>) => {
      const { to, subject, html, from } = job.data;

      logger.info({ jobId: job.id, to, subject }, 'Processing email job');

      try {
        const info = await transporter.sendMail({
          from: from || env.SMTP_FROM || 'noreply@omni.com',
          to,
          subject,
          html,
        });

        logger.info({ jobId: job.id, messageId: info.messageId }, 'Email sent successfully');

        return { success: true, messageId: info.messageId };
      } catch (error: any) {
        logger.error({ jobId: job.id, error }, 'Failed to send email');
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000, // 10 emails per second
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Email job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Email job failed');
  });

  return worker;
}
