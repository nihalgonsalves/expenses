import type { AlertDialogProps } from "@radix-ui/react-alert-dialog";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor, screen } from "@storybook/test";
import type { VariantProps } from "class-variance-authority";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import type { buttonVariants } from "./button";

const render = (
  props: AlertDialogProps,
  variant: VariantProps<typeof buttonVariants>["$variant"],
) => (
  <AlertDialog {...props}>
    <AlertDialogTrigger>Open</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction $variant={variant}>Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const meta: Meta<typeof AlertDialog> = {
  component: AlertDialog,
  render: (props) => render(props, "default"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // https://github.com/storybookjs/storybook/issues/25258
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await userEvent.click(canvas.getByRole("button"));

    await waitFor(async () => {
      await expect(
        within(screen.getByRole("alertdialog")).getByText(
          "Are you absolutely sure?",
        ),
      ).toBeVisible();
    });
  },
};

type Story = StoryObj<typeof AlertDialog>;

export const Base: Story = {};

export const Destructive: Story = {
  render: (props) => render(props, "destructive"),
};

export default meta;
