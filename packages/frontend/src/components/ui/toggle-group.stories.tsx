import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta: Meta<typeof ToggleGroup> = {
  component: ToggleGroup,
  args: {
    multiple: false,
    variant: "default",
    size: "default",
  },
  render: (props) => (
    <ToggleGroup {...props}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <BoldIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ItalicIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <UnderlineIcon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const Single: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export default meta;
