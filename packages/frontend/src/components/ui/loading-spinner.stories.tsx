import type { Meta, StoryObj } from '@storybook/react';

import { LoadingSpinner } from './loading-spinner';

const meta: Meta<typeof LoadingSpinner> = {
  component: LoadingSpinner,
  render: (props) => (
    <LoadingSpinner {...props}>Your email address</LoadingSpinner>
  ),
};

type Story = StoryObj<typeof LoadingSpinner>;

export const Base: Story = {};

export default meta;
