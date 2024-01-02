import type { Meta, StoryObj } from '@storybook/react';

import { THEME_DEFAULT } from '@nihalgonsalves/expenses-shared/types/theme';

import { IconPreview } from './IconPreview';

const meta: Meta<typeof IconPreview> = {
  component: IconPreview,
  args: { theme: THEME_DEFAULT },
  render: ({ theme }) => <IconPreview theme={theme} />,
};

type Story = StoryObj<typeof IconPreview>;

export const Blue: Story = { args: { theme: 'blue' } };

export const Slate: Story = { args: { theme: 'slate' } };

export const Rose: Story = { args: { theme: 'rose' } };

export const Orange: Story = { args: { theme: 'orange' } };

export const Green: Story = { args: { theme: 'green' } };

export const Yellow: Story = { args: { theme: 'yellow' } };

export const Violet: Story = { args: { theme: 'violet' } };

export default meta;
