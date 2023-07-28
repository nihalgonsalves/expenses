import crypto from 'crypto';
import { type ServerResponse, type IncomingMessage } from 'http';
import { createServer } from 'https';

import { type CertificateCreationResult, createCertificate } from 'pem';
import { type PushSubscription, generateVAPIDKeys } from 'web-push';

import {
  type IWebPushService,
  WebPushService,
} from '../src/service/notification/WebPushService';

export const getWebPushService = () => {
  const { publicKey, privateKey } = generateVAPIDKeys();

  return new WebPushService(publicKey, privateKey);
};

export class FakeWebPushService<T extends Record<string, unknown>>
  implements IWebPushService<T>
{
  public messages: { endpoint: string; payload: T }[] = [];

  sendNotification(pushSubscription: PushSubscription, payload: T) {
    this.messages.push({ endpoint: pushSubscription.endpoint, payload });
    return Promise.resolve();
  }
}

export const getUserKeys = () => {
  const userCurve = crypto.createECDH('prime256v1');
  const userPublicKey = userCurve.generateKeys();
  const userAuth = crypto.randomBytes(16);

  return {
    p256dh: userPublicKey.toString('base64url'),
    auth: userAuth.toString('base64url'),
  };
};

const { clientKey, certificate } = await new Promise<CertificateCreationResult>(
  (resolve, reject) => {
    createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
      if (err) {
        reject(err);
      } else {
        resolve(keys);
      }
    });
  },
);

export const createPushService = (
  onReceive: (req: IncomingMessage, res: ServerResponse) => void,
) =>
  new Promise<string>((resolve, reject) => {
    const server = createServer(
      { key: clientKey, cert: certificate },
      (req, res) => {
        onReceive(req, res);
      },
    );

    server.listen(undefined, () => {
      const addr = server.address();
      if (addr == null || typeof addr === 'string') {
        reject(new Error('Unexpected server address'));
      } else {
        resolve(`https://localhost:${addr.port}/`);
      }
    });
  });
