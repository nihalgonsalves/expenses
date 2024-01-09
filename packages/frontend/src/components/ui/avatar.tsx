"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { twx } from "./utils";

const Avatar = twx(
  AvatarPrimitive.Root,
)`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full`;
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = twx(AvatarPrimitive.Image)`aspect-square h-full w-full`;
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = twx(
  AvatarPrimitive.Fallback,
)`flex h-full w-full items-center justify-center rounded-full bg-muted`;
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
