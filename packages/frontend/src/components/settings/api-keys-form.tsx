import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  createApiKey as createApiKeyServerFn,
  deleteApiKey as deleteApiKeyServerFn,
  listApiKeys,
} from "#/api/api-key.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

const API_KEYS_QUERY_KEY = ["api-keys"] as const;

export const ApiKeysForm = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const { data: apiKeysResponse } = useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: listApiKeys,
  });
  const apiKeys = apiKeysResponse?.apiKeys ?? [];

  const createApiKey = useMutation({
    mutationFn: async (keyName: string) =>
      createApiKeyServerFn({ data: keyName }),
    onSuccess: async (apiKey) => {
      setNewKey(apiKey.key);
      setName("");
      await queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      await deleteApiKeyServerFn({ data: keyId });
    },
    onSuccess: async () => {
      setKeyToDelete(null);
      await queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete API key: ${error.message}`);
    },
  });

  const copyNewKey = async () => {
    if (newKey === null) return;
    await navigator.clipboard.writeText(newKey);
    toast.success("API key copied");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            API keys let trusted automations, such as iOS Shortcuts, access your
            expenses.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim() !== "") createApiKey.mutate(name.trim());
            }}
          >
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              placeholder="Name"
              aria-label="API key name"
            />
            <Button
              type="submit"
              isLoading={createApiKey.isPending}
              disabled={name.trim() === ""}
            >
              Create
            </Button>
          </form>
          {apiKeys.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <KeyRoundIcon className="size-4 shrink-0" />
                    <span>{apiKey.name ?? "Unnamed key"}</span>
                    <span className="text-muted-foreground">
                      {apiKey.start ?? ""}
                    </span>
                    <div className="grow" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setKeyToDelete(apiKey.id);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={newKey !== null}
        onOpenChange={(open) => {
          if (!open) setNewKey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy your API key</AlertDialogTitle>
            <AlertDialogDescription>
              This is the only time the full key will be shown. Store it
              securely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <code className="bg-muted rounded-md p-3 text-sm break-all">
            {newKey}
          </code>
          <AlertDialogFooter>
            <AlertDialogCancel>Done</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void copyNewKey();
              }}
            >
              <CopyIcon className="size-4" />
              Copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={keyToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setKeyToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any automation using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              isLoading={deleteApiKey.isPending}
              onClick={() => {
                if (keyToDelete !== null) deleteApiKey.mutate(keyToDelete);
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
