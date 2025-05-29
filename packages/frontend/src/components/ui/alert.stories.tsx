import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta: Meta<typeof Alert> = {
  component: Alert,
  args: {
    $variant: "default",
  },
  render: (props) => (
    <Alert {...props}>
      <ExclamationTriangleIcon />
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Description</AlertDescription>
    </Alert>
  ),
};

type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Destructive: Story = { args: { $variant: "destructive" } };

export default meta;
