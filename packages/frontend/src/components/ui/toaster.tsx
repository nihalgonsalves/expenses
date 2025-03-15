"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

import { useThemePreference } from "../../state/theme";

type ToasterProps = ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  const [theme] = useThemePreference();

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};
