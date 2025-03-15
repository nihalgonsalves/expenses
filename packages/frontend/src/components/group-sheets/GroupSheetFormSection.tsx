import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  ZUpdateSheetInput,
  type Sheet,
} from "@nihalgonsalves/expenses-shared/types/sheet";

import { useTRPC } from "../../api/trpc";
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

export const GroupSheetFormSection = ({
  groupSheet,
}: {
  groupSheet: Sheet;
}) => {
  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: updateSheet } = useMutation(
    trpc.sheet.updateSheet.mutationOptions(),
  );

  const form = useForm<z.infer<typeof ZUpdateSheetInput>>({
    resolver: zodResolver(ZUpdateSheetInput),
    mode: "onTouched",
    defaultValues: {
      id: groupSheet.id,
      name: groupSheet.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof ZUpdateSheetInput>) => {
    await updateSheet(values);

    await invalidate(
      trpc.sheet.mySheets.queryKey(),
      trpc.sheet.groupSheetById.queryKey(groupSheet.id),
    );

    toast.success("Group updated successfully");
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
