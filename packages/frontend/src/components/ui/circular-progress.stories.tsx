import type { Meta, StoryObj } from "@storybook/react";

import type { CssVariableName } from "@nihalgonsalves/expenses-shared/types/theme";

import { CircularProgress } from "./circular-progress";

const meta: Meta<typeof CircularProgress> = {
  component: CircularProgress,
  argTypes: {
    value: {
      control: {
        type: "range",
        min: 0,
        max: 100,
      },
    },
    size: {
      control: {
        type: "range",
        min: 0,
        max: 96,
      },
    },
    color: {
      control: {
        type: "radio",
      },
      options: [
        "primary",
        "secondary",
        "destructive",
      ] satisfies CssVariableName[],
    },
  },
  args: {
    value: 75,
    size: 32,
    color: "primary",
  },
  render: (props) => <CircularProgress {...props} />,
};

type Story = StoryObj<typeof CircularProgress>;

export const Base: Story = {};

export default meta;
