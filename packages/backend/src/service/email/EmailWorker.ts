import { TRPCError } from "@trpc/server";
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { createTransport, type SendMailOptions } from "nodemailer";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

import { EMAIL_BULLMQ_QUEUE, config } from "../../config.ts";
import type { IWorker } from "../../startWorkers.ts";
import { durationSeconds } from "../../utils/temporal.ts";

export type EmailPayload = Pick<SendMailOptions, "subject" | "text"> & {
  to: Extract<SendMailOptions["to"], { address: unknown }>;
};

export type IEmailWorker = {
  sendEmail: (email: EmailPayload) => Promise<void>;
};

export class EmailWorkerError extends TRPCError {}

const nodemailerTransport = createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
});

export class EmailWorker implements IEmailWorker, IWorker<EmailPayload, void> {
  queue: Queue<EmailPayload, void>;

  worker: Worker<EmailPayload, void>;

  globalRateLimiter: RateLimiterRedis;
  recipientRateLimiter: RateLimiterRedis;

  constructor(redis: Redis) {
    this.queue = new Queue(EMAIL_BULLMQ_QUEUE, {
      connection: redis,
    });

    this.worker = new Worker(
      EMAIL_BULLMQ_QUEUE,
      async (job) => EmailWorker.process(job.data),
      {
        connection: redis,
      },
    );

    this.recipientRateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:email:recipient",
      // one email per minute per recipient
      points: 1,
      duration: durationSeconds({ minutes: 1 }),
    });

    this.globalRateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:email:global",
      // very conservative current maximum of 100 emails per hour
      points: 100,
      duration: durationSeconds({ hours: 1 }),
    });
  }

  async sendEmail(email: EmailPayload) {
    try {
      await Promise.all([
        this.globalRateLimiter.consume("", 1),
        this.recipientRateLimiter.consume(email.to.address, 1),
      ]);
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        throw new EmailWorkerError({
          code: "TOO_MANY_REQUESTS",
          message: "Email rate limit exceeded",
          cause: error,
        });
      }
    }

    await this.queue.add("email", email);
  }

  private static async process(payload: EmailPayload): Promise<void> {
    await nodemailerTransport.sendMail({
      ...payload,
      from: `${config.APP_NAME} <${config.EMAIL_FROM}>`,
    });
  }
}
