import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationTriangleIcon, TrashIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ZPushSubscription } from "@nihalgonsalves/expenses-shared/types/notification";

import { trpc } from "../../api/trpc";
import { useSubscriptionEndpoint } from "../../state/preferences";
import { useNotificationPermission } from "../../utils/hooks/useNotificationPermission";
import { useServiceWorkerRegistration } from "../../utils/hooks/useServiceWorkerRegistration";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Switch } from "../ui/switch";

const IS_IOS_AND_NOT_STANDALONE = z.boolean().optional().parse(
  // @ts-expect-error iOS only
  globalThis.navigator.standalone,
);

const formSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export const NotificationPreferenceForm = () => {
  const { permission, request } = useNotificationPermission();
  const serviceWorkerRegistration = useServiceWorkerRegistration();
  const [endpoint, setEndpoint] = useSubscriptionEndpoint();

  const utils = trpc.useUtils();
  const { data: applicationServerKey } =
    trpc.notification.getPublicKey.useQuery();
  const { data: subscriptions } = trpc.notification.getSubscriptions.useQuery();

  const { mutateAsync: upsertSubscription } =
    trpc.notification.upsertSubscription.useMutation();
  const { mutateAsync: deleteSubscription } =
    trpc.notification.deleteSubscription.useMutation();

  const thisDeviceSubscription = subscriptions?.find(
    (s) => s.endpoint === endpoint,
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    form.reset({ notificationsEnabled: thisDeviceSubscription != null });
  }, [form, thisDeviceSubscription]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!data.notificationsEnabled) {
      if (!thisDeviceSubscription) return;

      await deleteSubscription(thisDeviceSubscription.id);
      await setEndpoint(undefined);
      await utils.notification.getSubscriptions.invalidate();
      return;
    }

    if (
      !applicationServerKey ||
      (permission === "default" && (await request()) !== "granted") ||
      !serviceWorkerRegistration
    ) {
      console.debug("[NotificationPreferenceForm] Push subscription failed", {
        applicationServerKey,
        permission,
        serviceWorkerRegistration,
      });

      return;
    }

    const rawSubscription =
      await serviceWorkerRegistration.pushManager.subscribe({
        applicationServerKey,
        userVisibleOnly: true,
      });

    const parsedSubscription = ZPushSubscription.parse(
      JSON.parse(JSON.stringify(rawSubscription)),
    );

    await upsertSubscription({
      // the subscription itself doesn't have the keys, and .toJSON() has only the endpoint.
      // stringify results in the correct object
      pushSubscription: parsedSubscription,
    });

    await setEndpoint(parsedSubscription.endpoint);

    await utils.notification.getSubscriptions.invalidate();
  };

  const handleDeleteSubscription = async (id: string) => {
    await deleteSubscription(id);
    await utils.notification.getSubscriptions.invalidate();
  };

  const disabled =
    permission === "denied" ||
    permission === "not_supported" ||
    !applicationServerKey;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {permission === "denied" && (
          <Alert $variant="destructive">
            <ExclamationTriangleIcon className="size-4" />
            <AlertTitle>You have denied notifications.</AlertTitle>
            <AlertDescription>
              Please allow them in your browser settings, and make sure that
              you&rsquo;re not using private browsing, which denies
              notifications automatically.
            </AlertDescription>
          </Alert>
        )}

        {permission === "not_supported" && (
          <Alert $variant="destructive">
            <ExclamationTriangleIcon className="size-4" />
            <AlertTitle>
              Push notifications are not supported in your browser or
              environment.
            </AlertTitle>
            <AlertDescription>
              Make sure that you&rsquo;re not using private browsing, and that
              you&rsquo;re accessing this page over https.
              {IS_IOS_AND_NOT_STANDALONE === false &&
                " On iOS 16.4 and above, click the share icon and Add to Home Screen for notification support."}
              {import.meta.env.DEV && (
                <b>
                  <br />
                  This is a development environment, you need ENABLE_DEV_PWA=1
                  for service worker support.
                </b>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <FormField
              control={form.control}
              name="notificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Notifications on this device</FormLabel>
                    <FormDescription>
                      Receive push notifications on this device
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        void form.handleSubmit(onSubmit)();
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        {subscriptions && subscriptions.length > 0 && (
          <ul className="grid gap-4">
            {subscriptions.map((subscription) => (
              <li key={subscription.id} className="flex items-center text-sm">
                <div>
                  <span className="font-semibold">
                    {subscription.description}
                    {subscription.endpoint === endpoint && " – this device"}
                  </span>
                  <br />
                  Notifications enabled
                </div>
                <div className="grow" />
                <Button
                  $variant="destructive"
                  className="text-2xl"
                  aria-label="Delete Subscription"
                  onClick={async () =>
                    handleDeleteSubscription(subscription.id)
                  }
                >
                  <TrashIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
