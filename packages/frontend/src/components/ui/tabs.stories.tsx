import type { Meta, StoryObj } from '@storybook/react';

import { Tabs, TabsList, TabsContent, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  ),
};

type Story = StoryObj<typeof Tabs>;

export const Base: Story = {};

export default meta;
