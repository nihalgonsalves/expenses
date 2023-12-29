import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor, screen } from '@storybook/test';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

const meta: Meta<typeof AlertDialog> = {
  component: AlertDialog,
};

type Story = StoryObj<typeof AlertDialog>;

export const Base: Story = {
  render: (props) => (
    <AlertDialog {...props}>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // https://github.com/storybookjs/storybook/issues/25258
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await userEvent.click(canvas.getByRole('button'));

    await waitFor(async () => {
      //👇 This assertion will pass if a DOM element with the matching id exists
      await expect(
        within(screen.getByRole('alertdialog')).getByText(
          'Are you absolutely sure?',
        ),
      ).toBeVisible();
    });
  },
};

export default meta;
