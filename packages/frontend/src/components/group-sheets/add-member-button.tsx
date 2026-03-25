import { zodResolver } from "@hookform/resolvers/zod";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZAddGroupSheetMemberInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/use-navigator-on-line";
import { ResponsiveDialog, useDialog } from "../form/responsive-dialog";
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
import { haptics } from "bzzz";

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
      name: "",
      email: "",
    },
  });

  const onSubmit = async (
    values: z.infer<typeof ZAddGroupSheetMemberInput>,
  ) => {
    try {
      await addGroupSheetMember(values);
    } catch (e) {
      haptics.error();
      throw e;
    }

    haptics.success();
    dialog.dismiss();

    await invalidate(
      trpc.sheet.groupSheetById.queryKey(groupSheetId),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheetId),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheetId),
    );
  };

  return (
    <ResponsiveDialog
      triggerType="trigger"
      render={
        <Button
          variant="outline"
          size="icon"
          disabled={!onLine}
          onClick={() => {
            haptics.selection();
          }}
        >
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
          onSubmit={form.handleSubmit(onSubmit, () => {
            haptics.error();
          })}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
