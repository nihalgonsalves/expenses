import type { Meta, StoryObj } from '@storybook/react';

import { CircularProgress } from './circular-progress';

const meta: Meta<typeof CircularProgress> = {
  component: CircularProgress,
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
      },
    },
    size: {
      control: {
        type: 'range',
        min: 0,
        max: 96,
      },
    },
  },
  args: {
    value: 75,
    size: 32,
  },
  render: (props) => <CircularProgress {...props} />,
};

type Story = StoryObj<typeof CircularProgress>;

export const Base: Story = {};

export default meta;
