import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { z } from 'zod';

import { type User } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { ProfileForm } from '../components/ProfileForm';
import {
  useNotificationPermission,
  usePushSubscription,
  useServiceWorkerRegistration,
  useToggleButtonOrientation,
} from '../utils/hooks';

import { Root } from './Root';

const IS_IOS_AND_NOT_STANDALONE = z.boolean().optional().parse(
  // @ts-expect-error iOS only
  globalThis.navigator.standalone,
);

// TODO Move to shared
export const ZPushSubscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().nonempty(),
    p256dh: z.string().nonempty(),
  }),
});

const NotificationPreference = () => {
  const toggleButtonOrientation = useToggleButtonOrientation('xs');

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
    _event: unknown,
    newValueUnknown: unknown,
  ) => {
    const notificationsEnabled = z.boolean().parse(newValueUnknown);

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
    <Card variant="outlined">
      <CardHeader title="Notifications" />
      <CardContent component={Stack} gap={2}>
        {permission === 'denied' && (
          <Alert severity="error">
            You have denied notifications. Please allow them in your browser
            settings.
          </Alert>
        )}
        {permission === 'not_supported' && (
          <Alert severity="warning">
            Push notifications are not supported in your browser or environment.
            Make sure that you&rsquo;re not using private browsing, and that
            you&rsquo;re accessing this page over https.
            {IS_IOS_AND_NOT_STANDALONE === false &&
              ' On iOS 16.4 and above, click the share icon and Add to Home Screen for notification support.'}
            {import.meta.env.DEV && (
              <b>
                <br />
                This is a development environment, you need ENABLE_DEV_PWA=1 for
                service worker support.
              </b>
            )}
          </Alert>
        )}
        <ToggleButtonGroup
          color="primary"
          value={notificationPreference}
          exclusive
          onChange={handleChangeNotificationPreference}
          fullWidth
          orientation={toggleButtonOrientation}
          disabled={disabled}
        >
          <ToggleButton value={false}>Off</ToggleButton>
          <ToggleButton value={true}>On</ToggleButton>
        </ToggleButtonGroup>
        <Collapse in={subscriptions ? subscriptions.length > 0 : false}>
          <List
            dense
            subheader={<ListSubheader>Existing Subscriptions</ListSubheader>}
          >
            {subscriptions?.map((subscription) => (
              <ListItem key={subscription.id}>
                <ListItemText
                  primary={
                    <>
                      {subscription.description}
                      {subscription.endpoint === pushSubscription?.endpoint &&
                        ' – this device'}
                    </>
                  }
                  secondary="Notifications enabled"
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const AuthenticatedSettings = ({ me }: { me: User }) => {
  return (
    <>
      <Card variant="outlined">
        <CardHeader title="Profile" />
        <CardContent>
          <ProfileForm me={me} />
        </CardContent>
      </Card>
      <NotificationPreference />
    </>
  );
};

export const SettingsPage = () => {
  const { data, error } = trpc.user.me.useQuery();

  return (
    <Root title="Settings">
      <Stack gap={2}>
        {error?.data?.httpStatus === 401 ? (
          <Card variant="outlined">
            <CardContent>You are not signed in</CardContent>
          </Card>
        ) : (
          data && <AuthenticatedSettings me={data} />
        )}
      </Stack>
    </Root>
  );
};
