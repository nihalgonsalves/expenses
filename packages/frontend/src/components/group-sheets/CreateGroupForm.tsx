import { zodResolver } from "@hookform/resolvers/zod";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { PersonIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { z } from "zod";

import { ZCreateGroupSheetInput } from "@nihalgonsalves/expenses-shared/types/sheet";

import { trpc } from "../../api/trpc";
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
import { Separator } from "../ui/separator";

export const CreateGroupForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const dialog = useDialog();

  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const utils = trpc.useUtils();
  const { mutateAsync: createGroupSheet, isLoading } =
    trpc.sheet.createGroupSheet.useMutation();

  const form = useForm<z.infer<typeof ZCreateGroupSheetInput>>({
    resolver: zodResolver(ZCreateGroupSheetInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      currencyCode: defaultCurrencyCode,
      additionalParticipantEmailAddresses: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "additionalParticipantEmailAddresses",
    control: form.control,
  });

  const handleAddParticipant = () => {
    append({ email: "" });
  };

  const handleDeleteParticipant = (index: number) => {
    remove(index);
  };

  const onSubmit = async (values: z.infer<typeof ZCreateGroupSheetInput>) => {
    const { id } = await createGroupSheet(values);

    dialog.dismiss();
    navigate(`/groups/${id}`, { replace: true });

    await utils.sheet.mySheets.invalidate();
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
                  autoFocus
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

        {fields.map(({ id }, i) => (
          <FormField
            key={id}
            control={form.control}
            name={`additionalParticipantEmailAddresses.${i}.email`}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{`Participant ${i + 1}'s email`}</FormLabel>
                <FormControl>
                  <div className="flex flex-row gap-2">
                    <Input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      {...field}
                    />
                    <Button
                      $variant="outline"
                      onClick={() => {
                        handleDeleteParticipant(i);
                      }}
                    >
                      <AccessibleIcon label="Delete Participant">
                        <TrashIcon />
                      </AccessibleIcon>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          type="button"
          className="mt-4 w-full"
          $variant="outline"
          onClick={handleAddParticipant}
        >
          <PersonIcon className="mr-2" />
          Add Participant
        </Button>

        <Separator className="my-2" />

        <Button
          className="w-full"
          type="submit"
          disabled={disabled}
          isLoading={isLoading}
        >
          <PlusIcon className="mr-2" /> Create Group
        </Button>
      </form>
    </Form>
  );
};
