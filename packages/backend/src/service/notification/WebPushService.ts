import webPush, { type PushSubscription } from 'web-push';

import { config } from '../../config';

export type IWebPushService<TPayload extends Record<string, unknown>> = {
  sendNotification: (
    pushSubscription: PushSubscription,
    payload: TPayload,
  ) => Promise<void>;
};

export class WebPushService<TPayload extends Record<string, unknown>>
  implements IWebPushService<TPayload>
{
  constructor(
    private vapidPublicKey = config.VAPID_PUBLIC_KEY,
    private vapidPrivateKey = config.VAPID_PRIVATE_KEY,
    private vapidSubject = `mailto:${config.VAPID_EMAIL}`,
  ) {}

  async sendNotification(
    pushSubscription: PushSubscription,
    payload: TPayload,
  ) {
    await webPush.sendNotification(pushSubscription, JSON.stringify(payload), {
      vapidDetails: {
        subject: this.vapidSubject,
        publicKey: this.vapidPublicKey,
        privateKey: this.vapidPrivateKey,
      },
    });
  }
}
