import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZCreateGroupSheetInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/use-navigator-on-line";
import { CurrencySelect } from "../form/currency-select";
import { useDialog } from "../form/responsive-dialog";
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

export const CreateGroupForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const dialog = useDialog();

  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: createGroupSheet, isPending } = useMutation(
    trpc.sheet.createGroupSheet.mutationOptions(),
  );

  const form = useForm({
    resolver: zodResolver(ZCreateGroupSheetInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      currencyCode: defaultCurrencyCode,
    },
  });

  const onSubmit = async (values: z.infer<typeof ZCreateGroupSheetInput>) => {
    const { id } = await createGroupSheet(values);

    dialog.dismiss();
    await navigate({
      to: `/groups/$sheetId`,
      params: { sheetId: id },
      replace: true,
    });

    await invalidate(trpc.sheet.mySheets.queryKey());
  };

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Group sheet name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  data-1p-ignore
                  placeholder="e.g.: Flat Expenses"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Group sheet currency</FormLabel>
              <FormControl>
                <CurrencySelect {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="w-full"
          type="submit"
          disabled={disabled}
          isLoading={isPending}
        >
          <PlusIcon className="mr-2" /> Create Group
        </Button>
      </form>
    </Form>
  );
};
