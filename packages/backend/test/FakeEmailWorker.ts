import type {
  EmailPayload,
  IEmailWorker,
} from "../src/service/email/EmailWorker";

export type FakeNotificationItem = {
  userId: string;
  payload: EmailPayload;
};

export class FakeEmailWorker implements IEmailWorker {
  public messages: EmailPayload[] = [];

  async sendEmail(email: EmailPayload) {
    this.messages.push(email);
  }
}
