import type { Meta, StoryObj } from "@storybook/react-vite";

import { noop } from "../utils/utils";

import {
  NavBarAvatar,
  LoggedInNavBarAvatar,
  LoggedOutNavBarAvatar,
} from "./NavBarAvatar";

const meta: Meta<typeof NavBarAvatar> = {
  component: NavBarAvatar,
  decorators: [(story) => <div className="bg-primary p-5">{story()}</div>],
};

type Story = StoryObj<typeof NavBarAvatar>;

export const LoggedIn: Story = {
  render: () => <LoggedInNavBarAvatar handleSignOut={noop} />,
};

export const LoggedOut: Story = {
  render: () => <LoggedOutNavBarAvatar />,
};

export default meta;
