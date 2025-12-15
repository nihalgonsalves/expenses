import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRightIcon } from "lucide-react";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    $variant: "default",
  },
  render: (props) => (
    <Button {...props}>{props.children ?? props.$variant}</Button>
  ),
};

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = { args: { $variant: "secondary" } };

export const Destructive: Story = { args: { $variant: "destructive" } };

export const Outline: Story = { args: { $variant: "outline" } };

export const Ghost: Story = { args: { $variant: "ghost" } };

export const Link: Story = { args: { $variant: "link" } };

export const Icon: Story = {
  args: {
    $variant: "outline",
    $size: "icon",
    children: <ChevronRightIcon className="size-4" />,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export default meta;
