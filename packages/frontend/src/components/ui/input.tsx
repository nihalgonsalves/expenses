import type { InputHTMLAttributes } from "react";

import { twx } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = twx.input`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`;
Input.displayName = "Input";

export { Input };
