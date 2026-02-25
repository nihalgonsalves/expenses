import { Slot } from "@radix-ui/react-slot";
import { motion, type HTMLMotionProps } from "motion/react";
import {
  type HTMLProps,
  type ComponentProps,
  createContext,
  useMemo,
  use,
  useId,
} from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from "react-hook-form";

import { fadeInOut } from "../../utils/motion";

import { Label } from "./label";
import { cn } from "./utils";

const Form: typeof FormProvider = ({ children, ...props }) => (
  <div className="relative">
    {/* {import.meta.env.DEV && (
      <DevTool
        control={props.control}
        placement="bottom-left"
        styles={{
          button: {
            opacity: 0.5,
            position: 'absolute',
            top: 0,
            bottom: 'unset',
            left: 'unset',
            right: 0,
          },
        }}
      />
    )} */}
    <FormProvider {...props}>{children}</FormProvider>{" "}
  </div>
);

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const contextValue = useMemo(() => ({ name: props.name }), [props.name]);

  return (
    <FormFieldContext.Provider value={contextValue}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  {} as FormItemContextValue,
);

const useFormField = () => {
  const fieldContext = use(FormFieldContext);
  const itemContext = use(FormItemContext);
  const { getFieldState, control } = useFormContext();
  const formState = useFormState({ control });

  const fieldState = getFieldState(fieldContext.name, formState);

  // oxlint-disable typescript/no-unnecessary-condition, typescript/strict-boolean-expressions
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItem = ({
  ref,
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) => {
  const id = useId();
  const contextValue = useMemo(() => ({ id }), [id]);

  return (
    <FormItemContext.Provider value={contextValue}>
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
};

const FormLabel = ({
  ref,
  className,
  ...props
}: ComponentProps<typeof Label>) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
};

const FormControl = ({ ref, ...props }: ComponentProps<typeof Slot>) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
};

const FormDescription = ({
  ref,
  className,
  ...props
}: HTMLMotionProps<"div">) => {
  const { formDescriptionId } = useFormField();

  return (
    <motion.p
      ref={ref}
      key={formDescriptionId}
      id={formDescriptionId}
      className={cn("text-muted-foreground text-[0.8rem]", className)}
      {...fadeInOut}
      {...props}
    />
  );
};

const FormMessage = ({
  ref,
  className,
  children,
  ...props
}: HTMLProps<HTMLParagraphElement>) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message) : children;

  // oxlint-disable typescript/strict-boolean-expressions
  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-destructive text-[0.8rem] font-medium", className)}
      {...props}
    >
      {body}
    </p>
  );
};

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
