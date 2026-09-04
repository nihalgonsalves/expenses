import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZCreatePersonalSheetInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import {
  currencyConversionQueries,
  useCurrencyOptions,
} from "../../api/currency-conversion";
import { sheetMutations, sheetQueries } from "../../api/sheet";
import { useQueryClient } from "../../api/query-client";
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
import { haptics } from "bzzz";

export const CreateSheetForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const dialog = useDialog();

  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();
  const { data: currencyOptions } = useCurrencyOptions();

  const { invalidate } = useQueryClient();
  const { mutateAsync: createSheet, isPending } = useMutation(
    sheetMutations.createPersonalSheet(),
  );

  const form = useForm({
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
    try {
      const { id } = await createSheet(values);

      haptics.success();
      dialog.dismiss();

      await navigate({
        to: `/sheets/$sheetId`,
        params: { sheetId: id },
        replace: true,
      });

      await invalidate(
        currencyConversionQueries.supportedCurrencies.queryKey(),
        sheetQueries.mySheets.queryKey(),
      );
    } catch (e) {
      haptics.error();
      throw e;
    }
  };

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          haptics.error();
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Sheet name</FormLabel>
              <FormControl>
                <Input
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
                <CurrencySelect
                  options={currencyOptions?.supported}
                  frequentOptions={currencyOptions?.frequent}
                  {...field}
                />
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
          <PlusCircleIcon className="mr-2" /> Create Sheet
        </Button>
      </form>
    </Form>
  );
};
