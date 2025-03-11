import type {
  EmailPayload,
  IEmailWorker,
} from "../src/service/email/EmailWorker.ts";

export class FakeEmailWorker implements IEmailWorker {
  public messages: EmailPayload[] = [];

  async sendEmail(email: EmailPayload) {
    this.messages.push(email);
  }
}
