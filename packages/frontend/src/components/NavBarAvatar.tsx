import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

import { useTRPC } from "../api/trpc";
import { useResetCache } from "../api/useCacheReset";
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

export const LoggedOutNavBarAvatar = ({
  className,
}: {
  className?: string | undefined;
}) => (
  <div className={cn("flex place-items-center gap-4", className)}>
    <Separator orientation="vertical">&nbsp;</Separator>

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
  </div>
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
  const location = useLocation();
  const navigate = useNavigate();

  const { trpc } = useTRPC();
  const resetCache = useResetCache();

  const { status, error } = useCurrentUser();
  const signOut = useMutation(trpc.user.signOut.mutationOptions());

  const handleSignOut = async () => {
    await signOut.mutateAsync();

    await navigate({
      to: "/auth/sign-in",
      params: { redirect: location.pathname },
    });

    await resetCache();
  };

  if (status == "success") {
    return (
      <LoggedInNavBarAvatar
        className={className}
        handleSignOut={handleSignOut}
      />
    );
  }

  if (
    status === "error" &&
    (error.data?.httpStatus === 401 || error.data?.httpStatus === 403)
  ) {
    return <LoggedOutNavBarAvatar className={className} />;
  }

  return null;
};
