import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon } from "lucide-react";
import { expect, userEvent, within, waitFor, screen } from "storybook/test";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button $variant="outline">Share</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone who has this link will be able to view this.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue="https://ui.shadcn.com/docs/installation"
              readOnly
            />
          </div>
          <Button type="submit" $size="sm" className="px-3">
            <span className="sr-only">Copy</span>
            <CopyIcon className="size-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose
            render={
              <Button type="button" $variant="secondary">
                Close
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));

    await waitFor(async () => {
      await expect(
        within(screen.getByRole("dialog")).getByText("Share link"),
      ).toBeVisible();
    });
  },
};

type Story = StoryObj<typeof Dialog>;

export const Base: Story = {};

export default meta;
