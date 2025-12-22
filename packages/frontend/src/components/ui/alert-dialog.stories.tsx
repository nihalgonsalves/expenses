import type { AlertDialogRootProps } from "@base-ui/react/alert-dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { VariantProps } from "class-variance-authority";
import { expect, userEvent, within, waitFor, screen } from "storybook/test";

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

const Template = ({
  variant,
  ...props
}: AlertDialogRootProps & {
  variant: VariantProps<typeof buttonVariants>["$variant"];
}) => (
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

const meta: Meta<typeof Template> = {
  component: Template,
  args: {
    variant: "default",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
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

type Story = StoryObj<typeof Template>;

export const Base: Story = {};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
};

export default meta;
