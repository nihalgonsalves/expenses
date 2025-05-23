import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZCreatePersonalSheetInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { CurrencySelect } from "../form/CurrencySelect";
import { useDialog } from "../form/ResponsiveDialog";
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

export const CreateSheetForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const dialog = useDialog();

  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: createSheet, isPending } = useMutation(
    trpc.sheet.createPersonalSheet.mutationOptions(),
  );

  const form = useForm<z.infer<typeof ZCreatePersonalSheetInput>>({
    resolver: zodResolver(ZCreatePersonalSheetInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      currencyCode: defaultCurrencyCode,
    },
  });

  const onSubmit = async (
    values: z.infer<typeof ZCreatePersonalSheetInput>,
  ) => {
    const { id } = await createSheet(values);

    dialog.dismiss();
    await navigate({
      to: `/sheets/$sheetId`,
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
              <FormLabel>Sheet name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  autoComplete="off"
                  data-1p-ignore
                  placeholder="Personal Expenses"
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
              <FormLabel>Sheet currency</FormLabel>
              <FormControl>
                <CurrencySelect {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="mt-4 w-full"
          type="submit"
          disabled={disabled}
          isLoading={isPending}
        >
          <PlusCircledIcon className="mr-2" /> Create Sheet
        </Button>
      </form>
    </Form>
  );
};
