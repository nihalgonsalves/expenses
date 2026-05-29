import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FingerprintIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "#/utils/auth.js";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const LIST_PASSKEYS_KEY = ["list-passkeys"] as const;
const LIST_ACCOUNTS_KEY = ["list-accounts"] as const;

const PasskeysCard = () => {
  const queryClient = useQueryClient();
  const [addingPasskey, setAddingPasskey] = useState(false);

  const { data: passkeys = [] } = useQuery({
    queryKey: LIST_PASSKEYS_KEY,
    queryFn: async () => {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });

  const {
    mutateAsync: deletePasskey,
    variables: deletingId,
    isPending: isDeleting,
  } = useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error)
        throw new Error(result.error.message ?? "Failed to delete passkey");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_PASSKEYS_KEY });
    },
    onError: (e: Error) =>
      toast.error(`Failed to delete passkey: ${e.message}`),
  });

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    try {
      const result = await authClient.passkey.addPasskey();
      if (result.error) {
        toast.error(`Failed to add passkey: ${result.error.message}`);
      } else {
        toast.success("Passkey added");
        await queryClient.invalidateQueries({ queryKey: LIST_PASSKEYS_KEY });
      }
    } catch {
      // user cancelled the native browser prompt
    } finally {
      setAddingPasskey(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
      </CardHeader>
      {passkeys.length > 0 && (
        <CardContent className="flex flex-col gap-2">
          {passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center gap-2">
              <FingerprintIcon className="size-4 shrink-0" />
              <span className="text-sm">
                {new Date(passkey.createdAt).toLocaleString()}
              </span>
              <div className="grow" />
              <Button
                size="sm"
                variant="outline"
                isLoading={isDeleting && deletingId === passkey.id}
                onClick={() => void deletePasskey(passkey.id)}
              >
                <Trash2Icon className="size-4" />
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      )}
      <CardFooter>
        <Button
          onClick={() => void handleAddPasskey()}
          isLoading={addingPasskey}
        >
          Add Passkey
        </Button>
      </CardFooter>
    </Card>
  );
};

type OAuthProvider = { provider: string; name: string };

const ProvidersCard = ({ providers }: { providers: OAuthProvider[] }) => {
  const queryClient = useQueryClient();
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: LIST_ACCOUNTS_KEY,
    queryFn: async () => {
      const result = await authClient.listAccounts();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });

  const {
    mutateAsync: unlinkAccount,
    variables: unlinkingVars,
    isPending: isUnlinking,
  } = useMutation({
    mutationFn: async ({
      accountId,
      providerId,
    }: {
      accountId: string;
      providerId: string;
    }) => {
      const result = await authClient.unlinkAccount({ accountId, providerId });
      if (result.error)
        throw new Error(result.error.message ?? "Failed to unlink account");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_ACCOUNTS_KEY });
    },
    onError: (e: Error) => toast.error(`Failed to disconnect: ${e.message}`),
  });

  const handleLink = async (providerId: string) => {
    setLinkingProvider(providerId);
    try {
      await authClient.oauth2.link({
        providerId,
        callbackURL: window.location.href,
      });
    } catch {
      toast.error("Failed to connect provider");
      setLinkingProvider(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Providers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {providers.map(({ provider, name }) => {
          const account = accounts.find((a) => a.providerId === provider);
          return (
            <div key={provider} className="flex items-center gap-2">
              <span className="text-sm font-medium">{name}</span>
              <div className="grow" />
              {account ? (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={
                    isUnlinking && unlinkingVars.providerId === provider
                  }
                  onClick={() =>
                    void unlinkAccount({
                      accountId: account.accountId,
                      providerId: provider,
                    })
                  }
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  isLoading={linkingProvider === provider}
                  onClick={() => void handleLink(provider)}
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const SecurityForm = ({
  config,
}: {
  config: {
    hasOauth: boolean;
    oauthProviders: OAuthProvider[];
  } | null;
}) => (
  <>
    <PasskeysCard />
    {config?.hasOauth && <ProvidersCard providers={config.oauthProviders} />}
  </>
);
