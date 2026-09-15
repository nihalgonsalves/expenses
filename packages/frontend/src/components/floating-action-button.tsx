import { haptics } from "bzzz";

import { Link } from "@tanstack/react-router";
import type { MouseEventHandler, ReactNode, Ref } from "react";

import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

const glassClassName =
  "border-foreground/10 contrast-more:ring-foreground bg-background/20 text-primary ring-primary/25 absolute right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] size-12 overflow-hidden rounded-full border text-2xl shadow-[0_10px_28px_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.5)] ring-1 backdrop-blur-md backdrop-saturate-150 hover:bg-background/30 [a]:hover:bg-background/30 md:bottom-4";

type FloatingActionButtonProps = {
  ref?: Ref<HTMLDivElement>;
  label: string;
  icon: ReactNode;
} & (
  | {
      to: string;
      onClick?: undefined;
    }
  | {
      to?: undefined;
      onClick: MouseEventHandler<HTMLButtonElement>;
    }
  | {
      to?: undefined;
      onClick?: undefined;
    }
);

export const FloatingActionButton = ({
  ref,
  to,
  onClick,
  label,
  icon,
}: FloatingActionButtonProps) => (
  <div ref={ref} className="fixed inset-x-0 bottom-0 z-40 w-full">
    <Tooltip>
      <TooltipTrigger
        render={
          to ? (
            <Button
              role="link"
              nativeButton={false}
              onClick={() => {
                haptics.selection();
              }}
              render={
                <Link to={to}>
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover/button:scale-110 group-active/button:scale-90"
                  >
                    {icon}
                  </span>
                </Link>
              }
              aria-label={label}
              className={glassClassName}
            />
          ) : (
            <Button
              aria-label={label}
              className={glassClassName}
              onClick={(e) => {
                haptics.selection();
                onClick?.(e);
              }}
            >
              <span className="transition-transform duration-150 group-hover/button:scale-110 group-active/button:scale-90">
                <span aria-hidden="true">{icon}</span>
              </span>
            </Button>
          )
        }
      />
      <TooltipContent side="left" sideOffset={4}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);
