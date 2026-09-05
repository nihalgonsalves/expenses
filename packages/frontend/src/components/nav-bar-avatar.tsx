import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { Link } from "@tanstack/react-router";
import { ChevronsUpDownIcon, UserIcon } from "lucide-react";

import { useCurrentUser, userApi } from "../api/user.functions";
import { useResetCache } from "../api/use-reset-cache";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
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

export const SidebarUserCard = () => {
  const me = useCurrentUser();
  const { mutateAsync: signOut } = useMutation(
    userApi.signOut.mutationOptions(),
  );
  const resetCache = useResetCache();

  if (me == null) {
    return (
      <Button
        variant="outline"
        className="w-full"
        nativeButton={false}
        render={<Link to="/auth/sign-in">Sign in</Link>}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-3 px-2 py-2 text-left"
          >
            <Avatar>
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 grow">
              <span className="block truncate text-sm font-medium">
                {me.name}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {me.email}
              </span>
            </span>
            <ChevronsUpDownIcon className="text-muted-foreground size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            await resetCache();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
