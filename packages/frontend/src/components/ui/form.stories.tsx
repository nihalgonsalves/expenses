import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { userEvent, within } from "storybook/test";
import { z } from "zod";

import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Separator } from "./separator";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

const FormExample = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  const [values, setValues] = useState("");

  const onSubmit = (v: z.infer<typeof formSchema>) => {
    setValues(JSON.stringify(v, null, 2));
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      <Separator className="my-8" />
      <pre>{values}</pre>
    </>
  );
};

const meta: Meta<typeof Form> = {
  component: Form,
  render: () => <FormExample />,
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByLabelText("Username"),
      "shadcn",
    );
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /submit/i }),
    );
  },
};

type Story = StoryObj<typeof Form>;

export const Base: Story = {};

export default meta;
