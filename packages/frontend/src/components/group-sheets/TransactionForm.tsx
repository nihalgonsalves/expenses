import { zodResolver } from "@hookform/resolvers/zod";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import {
  Pencil1Icon,
  PieChartIcon,
  PlusIcon,
  ReloadIcon,
  SwitchIcon,
  TokensIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { type Dinero, allocate } from "dinero.js";
import { useState, type ReactNode } from "react";
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { z } from "zod";

import {
  type Money,
  dineroToMoney,
  moneyToDinero,
  zeroMoney,
} from "@nihalgonsalves/expenses-shared/money";
import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import {
  ZCreateGroupSheetTransactionInput,
  type TransactionType,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { useCurrencyConversion } from "../../api/currencyConversion";
import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { allocateByCount } from "../../utils/math";
import {
  convertCurrency,
  formatCurrency,
  formatDecimalCurrency,
  toDinero,
  toMoneyValues,
} from "../../utils/money";
import {
  dateTimeLocalToZonedISOString,
  nowForDateTimeInput,
} from "../../utils/temporal";
import { Avatar } from "../Avatar";
import { CurrencySpan } from "../CurrencySpan";
import { CategorySelect, OTHER_CATEGORY } from "../form/CategorySelect";
import { CurrencySelect } from "../form/CurrencySelect";
import { MoneyField } from "../form/MoneyField";
import { useDialog } from "../form/ResponsiveDialog";
import { ToggleButtonGroup } from "../form/ToggleButtonGroup";
import { Alert, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";

import { ParticipantListItem } from "./ParticipantListItem";
import { ParticipantSelect } from "./ParticipantSelect";

const ZRatio = z.object({
  participantId: z.string().min(1),
  ratio: z.coerce.number().nonnegative(),
});
type Ratio = z.infer<typeof ZRatio>;

type GroupTransactionShare = {
  participantId: string;
  share: Money;
};

const GroupTransactionSplitType = {
  Evenly: "evenly",
  Selected: "selected",
  Shares: "shares",
  Percentage: "percentage",
  Amounts: "amounts",
} as const;

type GroupTransactionSplitType =
  (typeof GroupTransactionSplitType)[keyof typeof GroupTransactionSplitType];

const calcSplits = (
  participants: { id: string }[],
  currencyCode: string,
  dinero: Dinero<number>,
  ratios: Ratio[],
): GroupTransactionShare[] => {
  const ratioById = Object.fromEntries(
    ratios.map(({ participantId, ratio }) => [participantId, ratio]),
  );

  const indexedRatios = participants.map(({ id }) => ratioById[id] ?? 0);

  const allocations =
    indexedRatios.some((ratio) => ratio !== 0) &&
    indexedRatios.every((ratio) => Number.isFinite(ratio))
      ? allocate(dinero, indexedRatios)
      : [];

  return participants.map(({ id }, i) => {
    const alloc = allocations[i];

    return {
      participantId: id,
      share: alloc ? dineroToMoney(alloc) : zeroMoney(currencyCode),
    };
  });
};

const getDefaultRatios = (participants: { id: string }[], ratio = 1): Ratio[] =>
  participants.map(({ id }) => ({ participantId: id, ratio }));

type SplitConfig = (
  | {
      hasInput: true;
      inputMode: "decimal" | "numeric";
      unit: [singular: string, plural: string];
    }
  | { hasInput: false }
) &
  (
    | {
        expectedSum: (amount: number) => number;
        formatErrorTooHigh: (diff: number, currencyCode: string) => string;
        formatErrorTooLow: (diff: number, currencyCode: string) => string;
      }
    | { expectedSum: undefined }
  ) &
  (
    | {
        isRedistributable: true;
        expectedSum: (amount: number) => number;
      }
    | { isRedistributable?: undefined }
  ) & { resetNumber?: number };

const SPLIT_OPTIONS: {
  value: GroupTransactionSplitType;
  label: ReactNode;
}[] = [
  {
    value: GroupTransactionSplitType.Evenly,
    label: (
      <>
        <TokensIcon className="mr-2" /> Split Evenly
      </>
    ),
  },

  {
    value: GroupTransactionSplitType.Selected,
    label: (
      <>
        <SwitchIcon className="mr-2" /> Select Participants
      </>
    ),
  },

  {
    value: GroupTransactionSplitType.Shares,
    label: (
      <>
        <PieChartIcon className="mr-2" /> Shares
      </>
    ),
  },

  { value: GroupTransactionSplitType.Percentage, label: <>% Percentage</> },

  {
    value: GroupTransactionSplitType.Amounts,
    label: (
      <>
        <Pencil1Icon className="mr-2" /> Enter Amounts
      </>
    ),
  },
];

const SPLIT_CONFIG: Record<GroupTransactionSplitType, SplitConfig> = {
  [GroupTransactionSplitType.Evenly]: {
    expectedSum: undefined,
    hasInput: false,
  },
  [GroupTransactionSplitType.Selected]: {
    expectedSum: undefined,
    hasInput: false,
  },
  [GroupTransactionSplitType.Shares]: {
    expectedSum: undefined,
    hasInput: true,
    inputMode: "numeric",
    unit: ["share", "shares"],
    resetNumber: 1,
  },
  [GroupTransactionSplitType.Percentage]: {
    expectedSum: () => 100,
    formatErrorTooHigh: (diff: number) =>
      `The percentages must add up to 100%. You need to add ${diff.toFixed(
        2,
      )} percent.`,
    formatErrorTooLow: (diff: number) =>
      `The percentages must add up to 100%. You need to remove ${diff.toFixed(
        2,
      )} percent.`,
    hasInput: true,
    inputMode: "decimal",
    unit: ["%", "%"],
    resetNumber: 0,
    isRedistributable: true,
  },
  [GroupTransactionSplitType.Amounts]: {
    expectedSum: (amount) => amount,
    formatErrorTooHigh: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You need to account for ${formatDecimalCurrency(
        diff,
        currencyCode,
      )}.`,
    formatErrorTooLow: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You have ${formatDecimalCurrency(
        diff,
        currencyCode,
      )} too much.`,
    hasInput: false,
    resetNumber: 0,
    isRedistributable: true,
  },
};

const formSchema = ZCreateGroupSheetTransactionInput.omit({
  money: true,
  groupSheetId: true,
  splits: true,
}).extend({
  currencyCode: z.string().min(1),
  amount: z.number().positive({ message: "Amount is required" }),
  splitType: z.enum(GroupTransactionSplitType),
  ratios: z.array(ZRatio),
});

const getNewRatioValue = (newValue: number | string) => {
  if (typeof newValue === "number") {
    return newValue;
  } else if (newValue === "") {
    return 0;
  }

  const parsedValue = parseFloat(newValue);
  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  return undefined;
};

const SplitsFormSection = ({
  groupSheet,
  rate,
}: {
  groupSheet: GroupSheetByIdResponse;
  rate: { amount: number; scale: number } | undefined;
}) => {
  const form = useFormContext<z.infer<typeof formSchema>>();

  const amount = useWatch({ name: "amount", control: form.control });
  const currencyCode = useWatch({
    name: "currencyCode",
    control: form.control,
  });
  const splitType = useWatch({ name: "splitType", control: form.control });
  const ratios = useWatch({ name: "ratios", control: form.control });

  const money = toDinero(amount, currencyCode);

  const { fields } = useFieldArray({
    name: "ratios",
    control: form.control,
  });

  const participantNameById = Object.fromEntries(
    groupSheet.participants.map(({ id, name }) => [id, name]),
  );

  const splits = calcSplits(
    groupSheet.participants,
    currencyCode,
    money,
    ratios,
  );

  const shareByParticipantId = Object.fromEntries(
    splits.map(({ participantId, share }) => [participantId, share]),
  );

  const splitConfig = SPLIT_CONFIG[splitType];

  const splitErrorMessage = (() => {
    const totalSum = ratios.reduce((sum, { ratio }) => sum + ratio, 0);

    if (totalSum === 0) {
      return "You need to select a ratio for at least one participant.";
    }

    if (!splitConfig.expectedSum) {
      return undefined;
    }

    const diff = splitConfig.expectedSum(amount) - totalSum;

    if (diff < 0) {
      return splitConfig.formatErrorTooLow(Math.abs(diff), currencyCode);
    }

    if (diff > 0) {
      return splitConfig.formatErrorTooHigh(Math.abs(diff), currencyCode);
    }

    return undefined;
  })();

  const splitValid = splitErrorMessage == null;

  const [ratioFocused, setRatioFocused] = useState(false);

  const handleRatioFocus = () => {
    setRatioFocused(true);
  };

  const handleRatioBlur = (changedIndex: number) => {
    setRatioFocused(false);

    if (splitConfig.isRedistributable) {
      let dirtyRatioSum = 0;
      const otherParticipants: { id: string }[] = [];

      fields.forEach(({ participantId }, i) => {
        const value = form.getValues().ratios[i]?.ratio ?? 0;
        const { isDirty } = form.getFieldState(`ratios.${i}.ratio`);

        if (isDirty || i === changedIndex) {
          dirtyRatioSum += value;
        } else {
          otherParticipants.push({ id: participantId });
        }
      });

      const totalSum = splitConfig.expectedSum(amount);

      if (!Number.isFinite(dirtyRatioSum) || dirtyRatioSum >= totalSum) {
        return;
      }

      const remainingRatio = totalSum - dirtyRatioSum;

      if (splitType === GroupTransactionSplitType.Amounts) {
        const newSplits = calcSplits(
          otherParticipants,
          currencyCode,
          toDinero(remainingRatio, currencyCode),
          getDefaultRatios(otherParticipants),
        );

        newSplits.forEach(({ participantId, share }) => {
          const index = fields.findIndex(
            (field) => field.participantId === participantId,
          );

          form.setValue(`ratios.${index}.ratio`, share.amount);
        });
      } else if (splitType === GroupTransactionSplitType.Percentage) {
        const newSplits = allocateByCount(
          otherParticipants.length,
          remainingRatio,
        );

        newSplits.forEach((percentage, i) => {
          const participantId = otherParticipants[i]?.id;

          const index = fields.findIndex(
            (field) => field.participantId === participantId,
          );

          form.setValue(`ratios.${index}.ratio`, percentage);
        });
      }
    }
  };

  const handleChangeSplitType = (value: GroupTransactionSplitType) => {
    const newType = z.enum(GroupTransactionSplitType).parse(value);

    const isCurrentlyDirty = form.formState.dirtyFields.ratios?.some(
      ({ ratio }) => ratio === true,
    );

    switch (newType) {
      case GroupTransactionSplitType.Evenly:
      case GroupTransactionSplitType.Shares:
      case GroupTransactionSplitType.Selected:
        getDefaultRatios(groupSheet.participants).forEach((ratio, i) => {
          form.resetField(`ratios.${i}.ratio`, {
            defaultValue: ratio.ratio,
          });
        });
        break;

      case GroupTransactionSplitType.Percentage:
        groupSheet.participants.forEach((_, i) => {
          form.resetField(`ratios.${i}.ratio`, {
            defaultValue: 100 / groupSheet.participants.length,
          });
        });
        break;

      case GroupTransactionSplitType.Amounts:
        getDefaultRatios(groupSheet.participants, 0).forEach((ratio, i) => {
          form.resetField(`ratios.${i}.ratio`, {
            defaultValue: ratio.ratio,
          });
        });

        if (
          splitValid &&
          isCurrentlyDirty &&
          [
            GroupTransactionSplitType.Percentage,
            GroupTransactionSplitType.Shares,
          ].includes(splitType)
        ) {
          splits.map(({ share }, i) => {
            form.setValue(`ratios.${i}.ratio`, share.amount, {
              shouldDirty: true,
            });
          });
        }
        break;
    }
  };

  return (
    <>
      <FormItem>
        <FormField
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormControl>
                <ToggleButtonGroup<GroupTransactionSplitType>
                  className="grid w-full grid-cols-1 grid-rows-5 lg:grid-cols-5 lg:grid-rows-1"
                  options={SPLIT_OPTIONS}
                  {...field}
                  setValue={(value) => {
                    handleChangeSplitType(value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormItem>
      <div role="list" className="grid gap-2" style={{ paddingBlock: "1rem" }}>
        {fields.map(({ id, participantId, ratio }, i) => {
          const participantName = participantNameById[participantId];
          const share = shareByParticipantId[participantId];

          if (!participantName || !share) {
            throw new Error("Invalid form state");
          }

          return (
            <ParticipantListItem
              key={participantId}
              avatar={<Avatar name={participantName} />}
            >
              <FormField
                key={id}
                control={form.control}
                name={`ratios.${i}.ratio`}
                render={({ field }) => (
                  <FormItem className="flex grow items-center justify-between gap-2">
                    <div className="grow">
                      <FormLabel>
                        {participantNameById[participantId]}
                      </FormLabel>
                      <br />
                      <span className="text-gray-500 tabular-nums">
                        {splitValid ? (
                          <>
                            {formatCurrency(share)}
                            {groupSheet.currencyCode !== currencyCode && rate
                              ? ` (${formatCurrency(
                                  convertCurrency(
                                    share,
                                    groupSheet.currencyCode,
                                    rate,
                                  ),
                                )})`
                              : null}
                          </>
                        ) : (
                          <>&hellip;</>
                        )}
                      </span>
                    </div>

                    {splitConfig.resetNumber != null && (
                      <Button
                        $variant="ghost"
                        $size="icon"
                        disabled={
                          !form.formState.dirtyFields.ratios?.[i]?.ratio
                        }
                        onClick={() => {
                          form.resetField(`ratios.${i}.ratio`, {
                            defaultValue: splitConfig.resetNumber ?? 0,
                          });
                          handleRatioBlur(-1);
                        }}
                      >
                        <AccessibleIcon label="Reset ratio">
                          <ReloadIcon />
                        </AccessibleIcon>
                      </Button>
                    )}

                    {splitConfig.hasInput ? (
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <Input
                            className={cn(
                              "w-24 md:w-48",
                              form.formState.dirtyFields.ratios?.[i]?.ratio
                                ? "border-primary"
                                : "",
                            )}
                            inputMode={splitConfig.inputMode}
                            maxLength={4}
                            {...field}
                            onChange={(e) => {
                              field.onChange(getNewRatioValue(e.target.value));
                            }}
                            onFocus={handleRatioFocus}
                            onBlur={() => {
                              handleRatioBlur(i);
                              field.onBlur();
                            }}
                          />
                        </FormControl>

                        <div>
                          {ratio === 1
                            ? splitConfig.unit[0]
                            : splitConfig.unit[1]}
                        </div>
                      </div>
                    ) : null}
                    {splitType === GroupTransactionSplitType.Amounts && (
                      <div>
                        <FormControl>
                          <MoneyField
                            className={cn(
                              "w-24 md:w-48",
                              form.formState.dirtyFields.ratios?.[i]?.ratio
                                ? "border-primary"
                                : "",
                            )}
                            currencyCode={currencyCode}
                            {...field}
                            mode="onBlur"
                            value={field.value}
                            onFocus={handleRatioFocus}
                            onChange={(newAmount) => {
                              field.onChange(getNewRatioValue(newAmount));
                              handleRatioBlur(i);
                            }}
                          />
                        </FormControl>
                      </div>
                    )}
                    {splitType === GroupTransactionSplitType.Selected && (
                      <FormControl>
                        <Switch
                          {...field}
                          checked={field.value == 1}
                          onCheckedChange={(checked) => {
                            field.onChange(checked ? 1 : 0);
                          }}
                        />
                      </FormControl>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </ParticipantListItem>
          );
        })}
      </div>
      {splitErrorMessage && !ratioFocused ? (
        <Alert $variant="destructive">
          <AlertTitle>{splitErrorMessage}</AlertTitle>
        </Alert>
      ) : null}
    </>
  );
};

export const TransactionForm = ({
  groupSheet,
  me,
  type,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
  type: Exclude<TransactionType, "TRANSFER">;
}) => {
  const dialog = useDialog();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: createGroupSheetTransaction, isPending } = useMutation(
    trpc.transaction.createGroupSheetTransaction.mutationOptions(),
  );

  const onLine = useNavigatorOnLine();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      type,
      currencyCode: groupSheet.currencyCode,
      category: OTHER_CATEGORY,
      amount: 0,
      description: "",
      spentAt: nowForDateTimeInput(),
      paidOrReceivedById: me.id,
      splitType: GroupTransactionSplitType.Evenly,
      ratios: getDefaultRatios(groupSheet.participants),
    },
  });

  const amount = useWatch({ name: "amount", control: form.control });
  const currencyCode = useWatch({
    name: "currencyCode",
    control: form.control,
  });
  const spentAt = useWatch({ name: "spentAt", control: form.control });

  const [dineroValue, moneySnapshot] = toMoneyValues(amount, currencyCode);

  const {
    supportedCurrencies,
    rate,
    targetSnapshot: convertedMoneySnapshot,
  } = useCurrencyConversion(
    Temporal.PlainDate.from(spentAt),
    currencyCode,
    groupSheet.currencyCode,
    moneySnapshot,
  );
  const disabled = !onLine;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const splits = calcSplits(
      groupSheet.participants,
      currencyCode,
      dineroValue,
      values.ratios,
    );

    const basePayload = {
      type,
      groupSheetId: groupSheet.id,
      paidOrReceivedById: values.paidOrReceivedById,
      description: values.description,
      category: values.category,
      spentAt: dateTimeLocalToZonedISOString(values.spentAt),
    };

    if (groupSheet.currencyCode === currencyCode) {
      await createGroupSheetTransaction({
        ...basePayload,
        money: moneySnapshot,
        splits,
      });
    } else if (convertedMoneySnapshot) {
      await createGroupSheetTransaction({
        ...basePayload,
        money: convertedMoneySnapshot,
        splits: calcSplits(
          groupSheet.participants,
          currencyCode,
          moneyToDinero(convertedMoneySnapshot),
          values.ratios,
        ),
      });
    }

    dialog.dismiss();

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId: groupSheet.id,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheet.id),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheet.id),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-4">
          <div className="grow">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {type === "EXPENSE"
                      ? "How much was spent?"
                      : "How much was received?"}
                  </FormLabel>
                  <FormControl>
                    <MoneyField
                      className="grow"
                      autoFocus
                      currencyCode={currencyCode}
                      {...field}
                    />
                  </FormControl>

                  {convertedMoneySnapshot ? (
                    <FormDescription>
                      <CurrencySpan money={convertedMoneySnapshot} />
                    </FormDescription>
                  ) : null}

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  {supportedCurrencies.includes(groupSheet.currencyCode) && (
                    <CurrencySelect options={supportedCurrencies} {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paidOrReceivedById"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                {type === "EXPENSE" ? "Who paid?" : "Who received money?"}
              </FormLabel>
              <FormControl>
                <ParticipantSelect
                  groupSheet={groupSheet}
                  {...field}
                  onChange={(newId) => {
                    if (!newId) return;

                    field.onChange(newId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelect
                  className="w-full"
                  placeholder="Select a category"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spentAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>When?</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="appearance-none"
                  data-chromatic="ignore"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <SplitsFormSection groupSheet={groupSheet} rate={rate} />

        <Button
          className="w-full capitalize"
          isLoading={isPending}
          type="submit"
          disabled={disabled}
        >
          <PlusIcon className="mr-2" /> Add {type.toLocaleLowerCase()}
        </Button>
      </form>
    </Form>
  );
};
