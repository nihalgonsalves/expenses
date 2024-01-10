import { Queue, Worker } from "bullmq";
import type IORedis from "ioredis";
import { createTransport } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { EMAIL_BULLMQ_QUEUE, config } from "../../config";
import type { IWorker } from "../../startWorkers";

export type EmailPayload = Pick<
  Mail.Options,
  "from" | "to" | "subject" | "text"
>;

export type IEmailWorker = {
  sendEmail: (email: EmailPayload) => Promise<void>;
};

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

  constructor(redis: IORedis) {
    this.queue = new Queue(EMAIL_BULLMQ_QUEUE, {
      connection: redis,
    });

    this.worker = new Worker(
      EMAIL_BULLMQ_QUEUE,
      async (job) => this.process(job.data),
      {
        connection: redis,
      },
    );
  }

  async sendEmail(email: EmailPayload) {
    await this.queue.add("email", email);
  }

  private async process(payload: EmailPayload): Promise<void> {
    await nodemailerTransport.sendMail(payload);
  }
}
