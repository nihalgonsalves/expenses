import { z } from 'zod';

import { trpc } from '../../api/trpc';
import {
  useNotificationPermission,
  usePushSubscription,
  useServiceWorkerRegistration,
} from '../../utils/hooks';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';

const IS_IOS_AND_NOT_STANDALONE = z.boolean().optional().parse(
  // @ts-expect-error iOS only
  globalThis.navigator.standalone,
);

// TODO Move to shared
const ZPushSubscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().nonempty(),
    p256dh: z.string().nonempty(),
  }),
});

export const NotificationPreferenceForm = () => {
  const { permission, request } = useNotificationPermission();
  const serviceWorkerRegistration = useServiceWorkerRegistration();
  const pushSubscription = usePushSubscription();

  const utils = trpc.useContext();
  const { data: applicationServerKey } =
    trpc.notification.getPublicKey.useQuery();
  const { data: subscriptions } = trpc.notification.getSubscriptions.useQuery();

  const { mutateAsync: upsertSubscription } =
    trpc.notification.upsertSubscription.useMutation();
  const { mutateAsync: deleteSubscription } =
    trpc.notification.deleteSubscription.useMutation();

  const thisDeviceSubscription = subscriptions?.find(
    ({ endpoint }) => endpoint === pushSubscription?.endpoint,
  );

  const notificationPreference = thisDeviceSubscription != null;

  const handleChangeNotificationPreference = async (
    notificationsEnabled: boolean,
  ) => {
    if (!notificationsEnabled) {
      if (!thisDeviceSubscription) return;

      await deleteSubscription(thisDeviceSubscription.id);
      await utils.notification.getSubscriptions.invalidate();
      return;
    }

    if (!applicationServerKey) return;
    if (permission === 'default' && (await request()) !== 'granted') return;

    if (!serviceWorkerRegistration) {
      return;
    }

    const { pushManager } = serviceWorkerRegistration;

    const subscription = await pushManager.subscribe({
      applicationServerKey,
      userVisibleOnly: true,
    });

    await upsertSubscription({
      // the subscription itself doesn't have the keys, and .toJSON() has only the endpoint.
      // stringify results in the correct object
      pushSubscription: ZPushSubscription.parse(
        JSON.parse(JSON.stringify(subscription)),
      ),
    });

    await utils.notification.getSubscriptions.invalidate();
  };

  const disabled =
    permission === 'denied' ||
    permission === 'not_supported' ||
    !applicationServerKey;

  return (
    <section className="card card-bordered card-compact">
      <div className="card-body flex flex-col gap-8">
        <h2 className="card-title">Notifications</h2>
        {permission === 'denied' && (
          <div className="alert alert-warning">
            You have denied notifications. Please allow them in your browser
            settings.
          </div>
        )}
        {permission === 'not_supported' && (
          <div className="alert alert-warning">
            <p>
              Push notifications are not supported in your browser or
              environment. Make sure that you&rsquo;re not using private
              browsing, and that you&rsquo;re accessing this page over https.
              {IS_IOS_AND_NOT_STANDALONE === false &&
                ' On iOS 16.4 and above, click the share icon and Add to Home Screen for notification support.'}
              {import.meta.env.DEV && (
                <b>
                  <br />
                  This is a development environment, you need ENABLE_DEV_PWA=1
                  for service worker support.
                </b>
              )}
            </p>
          </div>
        )}
        <ToggleButtonGroup
          value={notificationPreference}
          setValue={handleChangeNotificationPreference}
          disabled={disabled}
          options={[
            { value: false, label: 'Off' },
            { value: true, label: 'On' },
          ]}
        />

        {subscriptions && subscriptions.length > 0 && (
          <ul className="grid gap-4">
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <span className="font-semibold">
                  {subscription.description}
                  {subscription.endpoint === pushSubscription?.endpoint &&
                    ' – this device'}
                </span>
                <br />
                Notifications enabled
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
