import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { type Dinero, allocate } from "dinero.js";
import {
  PieChartIcon,
  RotateCcwIcon,
  SplitIcon,
  ListChecksIcon,
  CalculatorIcon,
  CirclePercentIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  dineroToMoney,
  zeroMoney,
} from "@nihalgonsalves/expenses-shared/money";
import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import { allocateByCount } from "../../utils/math";
import {
  convertCurrency,
  formatCurrency,
  formatDecimalCurrency,
  toDinero,
} from "../../utils/money";

import { Avatar } from "../avatar";
import { MoneyField } from "../form/money-field";
import { ToggleButtonGroup } from "../form/toggle-button-group";
import { Alert, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";

import { ParticipantListItem } from "./participant-list-item";
import {
  type formSchema,
  GroupTransactionSplitType,
  type GroupTransactionShare,
  type Ratio,
} from "./transaction-form/form-schema";

export const calcSplits = (
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

export const getDefaultRatios = (
  participants: { id: string }[],
  ratio = 1,
): Ratio[] => participants.map(({ id }) => ({ participantId: id, ratio }));

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
        <SplitIcon className="mr-2" /> Split Evenly
      </>
    ),
  },

  {
    value: GroupTransactionSplitType.Selected,
    label: (
      <>
        <ListChecksIcon className="mr-2" /> Select Participants
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

  {
    value: GroupTransactionSplitType.Percentage,
    label: (
      <>
        <CirclePercentIcon className="mr-2" /> Percentage
      </>
    ),
  },

  {
    value: GroupTransactionSplitType.Amounts,
    label: (
      <>
        <CalculatorIcon className="mr-2" /> Enter Amounts
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

export const SplitsFormSection = ({
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

  const currencyCodeOrGroupDefault = currencyCode || groupSheet.currencyCode;

  const money = toDinero(amount, currencyCodeOrGroupDefault);

  const { fields } = useFieldArray({
    name: "ratios",
    control: form.control,
  });

  const participantNameById = Object.fromEntries(
    groupSheet.participants.map(({ id, name }) => [id, name]),
  );

  const splits = calcSplits(
    groupSheet.participants,
    currencyCodeOrGroupDefault,
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
      return splitConfig.formatErrorTooLow(
        Math.abs(diff),
        currencyCodeOrGroupDefault,
      );
    }

    if (diff > 0) {
      return splitConfig.formatErrorTooHigh(
        Math.abs(diff),
        currencyCodeOrGroupDefault,
      );
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
          currencyCodeOrGroupDefault,
          toDinero(remainingRatio, currencyCodeOrGroupDefault),
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
              className="min-h-14"
            >
              <FormField
                key={id}
                control={form.control}
                name={`ratios.${i}.ratio`}
                render={({ field: { value, ...field } }) => (
                  <FormItem className="flex grow items-center gap-2">
                    <div className="flex grow flex-col gap-2">
                      <FormLabel>
                        {participantNameById[participantId]}
                      </FormLabel>
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
                        variant="ghost"
                        size="icon"
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
                          <RotateCcwIcon />
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
                            value={value}
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
                            currencyCode={currencyCodeOrGroupDefault}
                            {...field}
                            mode="onBlur"
                            value={value}
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
                          checked={value == 1}
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
        <Alert variant="destructive">
          <AlertTitle>{splitErrorMessage}</AlertTitle>
        </Alert>
      ) : null}
    </>
  );
};
