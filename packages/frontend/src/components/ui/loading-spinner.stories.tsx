import type { Meta, StoryObj } from "@storybook/react";

import { LoadingSpinner } from "./loading-spinner";

const meta: Meta<typeof LoadingSpinner> = {
  component: LoadingSpinner,
  render: (props) => (
    <div className="bg-primary rounded-md p-4">
      <LoadingSpinner {...props} />
    </div>
  ),
};

type Story = StoryObj<typeof LoadingSpinner>;

export const Base: Story = {};

export default meta;
