import { zodResolver } from "@hookform/resolvers/zod";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { PlusIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZAddGroupSheetMemberInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
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

  const { mutateAsync: addGroupSheetMember, isPending } =
    trpc.sheet.addGroupSheetMember.useMutation();
  const utils = trpc.useUtils();

  const form = useForm<z.infer<typeof ZAddGroupSheetMemberInput>>({
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

    await Promise.all([
      utils.sheet.groupSheetById.invalidate(groupSheetId),
      utils.transaction.getParticipantSummaries.invalidate(groupSheetId),
      utils.transaction.getSimplifiedBalances.invalidate(groupSheetId),
    ]);

    dialog.dismiss();
  };

  return (
    <ResponsiveDialog
      trigger={
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
