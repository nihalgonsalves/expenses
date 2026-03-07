import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { Link } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

import { useCurrentUser } from "../api/useCurrentUser";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { UserButton } from "@daveyplate/better-auth-ui";

export const LoggedOutNavBarAvatar = () => (
  <>
    <Button
      variant="outline"
      className="text-primary-foreground bg-transparent"
      role="link"
      nativeButton={false}
      render={<Link to="/auth/sign-in">Sign in</Link>}
    />
    <Button
      variant="outline"
      className="text-primary-foreground bg-transparent"
      role="link"
      nativeButton={false}
      render={<Link to="/auth/sign-up">Sign up</Link>}
    />
  </>
);

export const LoggedInNavBarAvatar = ({
  handleSignOut,
  className,
}: {
  handleSignOut: () => void;
  className?: string | undefined;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button variant="ghost" size="icon" {...(className && { className })}>
          <AccessibleIcon label="Profile and Settings menu">
            <UserIcon className="text-primary-foreground size-5" />
          </AccessibleIcon>
        </Button>
      }
    />
    <DropdownMenuContent>
      <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const NavBarAvatar = ({ className }: { className?: string }) => {
  const me = useCurrentUser();

  return (
    <div className={cn("flex place-items-center gap-4", className)}>
      <Separator orientation="vertical">&nbsp;</Separator>
      {me != null ? (
        <UserButton size="icon" disableDefaultLinks />
      ) : (
        <LoggedOutNavBarAvatar />
      )}
    </div>
  );
};
