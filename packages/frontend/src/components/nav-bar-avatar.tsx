import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { Link } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

import { useCurrentUser, userApi } from "../api/user";
import { useResetCache } from "../api/use-reset-cache";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { useMutation } from "@tanstack/react-query";

export const LoggedOutNavBarAvatar = () => (
  <Button
    variant="outline"
    className="text-primary-foreground bg-transparent"
    role="link"
    nativeButton={false}
    render={<Link to="/auth/sign-in">Sign in</Link>}
  />
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
  const { mutateAsync: signOut } = useMutation(
    userApi.signOut.mutationOptions(),
  );
  const resetCache = useResetCache();

  return (
    <div className={cn("flex place-items-center gap-4", className)}>
      <Separator orientation="vertical">&nbsp;</Separator>
      {me != null ? (
        <LoggedInNavBarAvatar
          handleSignOut={async () => {
            await signOut();
            await resetCache();
          }}
        />
      ) : (
        <LoggedOutNavBarAvatar />
      )}
    </div>
  );
};
