import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectContent,
} from "./select";

const meta: Meta<typeof Select> = {
  component: Select,
  render: (props) => (
    <Select {...props}>
      <SelectTrigger className="w-[180px]">
        {props.value != null ? (
          <SelectValue />
        ) : (
          <SelectValue>Select a fruit…</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox"));

    // TODO: select and verify selection
  },
};

type Story = StoryObj<typeof Select>;

export const Base: Story = {};

export default meta;
