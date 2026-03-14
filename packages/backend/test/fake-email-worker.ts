import type {
  EmailPayload,
  IEmailWorker,
} from "../src/service/email/email-worker.ts";

export class FakeEmailWorker implements IEmailWorker {
  public messages: EmailPayload[] = [];

  async sendEmail(email: EmailPayload) {
    this.messages.push(email);
  }
}
