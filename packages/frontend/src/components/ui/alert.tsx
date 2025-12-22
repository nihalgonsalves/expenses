import { type VariantProps, cva } from "class-variance-authority";
import type { TwcComponentProps } from "react-twc";

import { cn, twx } from "./utils";

const alertVariants = cva(
  [
    "relative",
    "w-full",
    "rounded-lg",
    "border",
    "px-4",
    "py-3",
    "text-sm",
    "[&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute",
    "[&>svg]:left-4",
    "[&>svg]:top-4",
    "[&>svg]:text-foreground",
    "[&>svg~*]:pl-7",
  ],
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: [
          "border-destructive/50",
          "text-destructive",
          "dark:border-destructive",
          "[&>svg]:text-destructive",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertProps = TwcComponentProps<"div"> & VariantProps<typeof alertVariants>;

const Alert = twx.div.attrs({ role: "alert" })<AlertProps>(({ variant }) =>
  cn(alertVariants({ variant })),
);
Alert.displayName = "Alert";

const AlertTitle = twx.h5`mb- font-medium leading-none tracking-tight`;
AlertTitle.displayName = "AlertTitle";

const AlertDescription = twx.div`text-sm [&_p]:leading-relaxed`;
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
