import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  component: Badge,
};

type Story = StoryObj<typeof Badge>;

export const Base: Story = {
  argTypes: {
    variant: {
      control: {
        type: 'select',
      },
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
  render: (props) => <Badge {...props}>Default</Badge>,
};

export default meta;
