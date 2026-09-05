import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  ZUpdateSheetInput,
  type Sheet,
} from "@nihalgonsalves/expenses-shared/types/sheet";

import { sheetMutations, sheetQueries } from "../../api/sheet.functions";
import { useQueryClient } from "../../api/query-client";
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

export const PersonalSheetFormSection = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const { invalidate } = useQueryClient();
  const { mutateAsync: updateSheet } = useMutation(
    sheetMutations.updateSheet(),
  );

  const form = useForm({
    resolver: zodResolver(ZUpdateSheetInput),
    mode: "onTouched",
    defaultValues: {
      id: personalSheet.id,
      name: personalSheet.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof ZUpdateSheetInput>) => {
    await updateSheet(values);

    await invalidate(
      sheetQueries.personalSheetById.queryKey(personalSheet.id),
      sheetQueries.mySheets.queryKey(),
    );

    toast.success("Sheet updated successfully");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save
        </Button>
      </form>
    </Form>
  );
};
