import { zodResolver } from "@hookform/resolvers/zod";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZAddGroupSheetMemberInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { ResponsiveDialog, useDialog } from "../form/ResponsiveDialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export const AddMemberButton = ({ groupSheetId }: { groupSheetId: string }) => {
  const dialog = useDialog();
  const onLine = useNavigatorOnLine();

  const { trpc, invalidate } = useTRPC();

  const { mutateAsync: addGroupSheetMember, isPending } = useMutation(
    trpc.sheet.addGroupSheetMember.mutationOptions(),
  );

  const form = useForm({
    resolver: zodResolver(ZAddGroupSheetMemberInput),
    mode: "onSubmit",
    defaultValues: {
      groupSheetId,
      email: "",
    },
  });

  const onSubmit = async (
    values: z.infer<typeof ZAddGroupSheetMemberInput>,
  ) => {
    await addGroupSheetMember(values);

    await invalidate(
      trpc.sheet.groupSheetById.queryKey(groupSheetId),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheetId),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheetId),
    );

    dialog.dismiss();
  };

  return (
    <ResponsiveDialog
      triggerType="trigger"
      render={
        <Button $variant="outline" $size="icon" disabled={!onLine}>
          <AccessibleIcon label="Add Participant">
            <PlusIcon />
          </AccessibleIcon>
        </Button>
      }
      title="Add Participant"
    >
      <Form {...form}>
        <form
          className="flex flex-col gap-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button isLoading={isPending} type="submit">
            <PlusIcon className="mr-2" />
            Add
          </Button>
        </form>
      </Form>
    </ResponsiveDialog>
  );
};
