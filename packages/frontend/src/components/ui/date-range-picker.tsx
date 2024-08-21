"use client";

// https://github.com/johnpolacek/date-range-picker-for-shadcn/blob/2ee5787f5b2a2034f9133c484847ec4df9d296df/src/date-range-picker.tsx

import { CheckIcon, CalendarIcon } from "@radix-ui/react-icons";
import { formatDateRange } from "little-date";
import { type FC, useState, useEffect, useCallback } from "react";

import { useBreakpoint } from "../../utils/hooks/useBreakpoint";
import { shortDateFormatter } from "../../utils/temporal";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "./utils";

export type DateRangePickerProps = {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string | undefined;
  /** Initial value for end date */
  initialDateTo?: Date | string | undefined;
  /** Alignment of popover */
  align?: "start" | "center" | "end";
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  // Split the date string to get year, month, and day parts
  const [year, month, day] = dateInput
    .split("-")
    .map((part) => parseInt(part, 10));
  if (
    !(
      year != null &&
      month != null &&
      day != null &&
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    )
  ) {
    throw new Error(`Invalid date string: ${dateInput}`);
  }

  // Create a new Date object using the local timezone
  // Note: Month is 0-indexed, so subtract 1 from the month part
  const date = new Date(year, month - 1, day);
  return date;
};

type DateRange = {
  from: Date;
  to: Date | undefined;
};

type Preset = {
  name: string;
  label: string;
};

// Define presets
const PRESETS: Preset[] = [
  { name: "today", label: "Today" },
  { name: "yesterday", label: "Yesterday" },
  { name: "last7", label: "Last 7 days" },
  { name: "last14", label: "Last 14 days" },
  { name: "last30", label: "Last 30 days" },
  { name: "thisWeek", label: "This Week" },
  { name: "lastWeek", label: "Last Week" },
  { name: "thisMonth", label: "This Month" },
  { name: "lastMonth", label: "Last Month" },
];

const PresetButton = ({
  preset,
  label,
  isSelected,
  setPreset,
}: {
  preset: string;
  label: string;
  isSelected: boolean;
  setPreset: (preset: string) => void;
}): JSX.Element => (
  <Button
    className={cn(isSelected && "pointer-events-none")}
    $variant="ghost"
    onClick={() => {
      setPreset(preset);
    }}
  >
    <>
      <span className={cn("pr-2 opacity-0", isSelected && "opacity-70")}>
        <CheckIcon width={18} height={18} />
      </span>
      {label}
    </>
  </Button>
);

/** The DateRangePicker component allows a user to select a range of dates */
export const DateRangePicker: FC<DateRangePickerProps> = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  onUpdate,
  align = "end",
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const [range, setRange] = useState<DateRange>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to:
      initialDateTo != null
        ? getDateAdjustedForTimezone(initialDateTo)
        : getDateAdjustedForTimezone(initialDateFrom),
  });

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined,
  );

  const isSmallScreen = !useBreakpoint("lg");

  const getPresetRange = (presetName: string): DateRange => {
    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case "today":
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "last7":
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last14":
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last30":
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastWeek":
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return { from, to };
  };

  const setPreset = (preset: string): void => {
    const nextRange = getPresetRange(preset);
    setRange(nextRange);
  };

  const checkPreset = useCallback((): void => {
    for (const preset of PRESETS) {
      const presetRange = getPresetRange(preset.name);

      const normalizedRangeFrom = new Date(range.from);
      normalizedRangeFrom.setHours(0, 0, 0, 0);
      const normalizedPresetFrom = new Date(
        presetRange.from.setHours(0, 0, 0, 0),
      );

      const normalizedRangeTo = new Date(range.to ?? 0);
      normalizedRangeTo.setHours(0, 0, 0, 0);
      const normalizedPresetTo = new Date(
        presetRange.to?.setHours(0, 0, 0, 0) ?? 0,
      );

      if (
        normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
        normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }

    setSelectedPreset(undefined);
  }, [range]);

  const resetValues = (): void => {
    setRange({
      from:
        typeof initialDateFrom === "string"
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
      to:
        initialDateTo != null
          ? typeof initialDateTo === "string"
            ? getDateAdjustedForTimezone(initialDateTo)
            : initialDateTo
          : typeof initialDateFrom === "string"
            ? getDateAdjustedForTimezone(initialDateFrom)
            : initialDateFrom,
    });
  };

  useEffect(() => {
    checkPreset();
  }, [checkPreset]);

  return (
    <Popover
      modal
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetValues();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button $variant="outline" className="h-8">
          <CalendarIcon className="mr-2 size-4" />

          <div>
            {range.to
              ? formatDateRange(range.from, range.to)
              : `${shortDateFormatter.format(range.from)} - `}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto">
        <div className="flex py-2">
          <div className="flex">
            <div className="flex flex-col">
              <div className="flex flex-col items-center justify-end gap-2 px-3 pb-4 lg:flex-row lg:items-start lg:pb-0">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <DateInput
                      value={range.from}
                      onChange={(date) => {
                        const toDate =
                          range.to == null || date > range.to ? date : range.to;
                        setRange((prevRange) => ({
                          ...prevRange,
                          from: date,
                          to: toDate,
                        }));
                      }}
                    />
                    <div className="py-1">-</div>
                    <DateInput
                      value={range.to}
                      onChange={(date) => {
                        const fromDate = date < range.from ? date : range.from;
                        setRange((prevRange) => ({
                          ...prevRange,
                          from: fromDate,
                          to: date,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              {isSmallScreen ? (
                <Select
                  defaultValue={selectedPreset || ""}
                  onValueChange={(value) => {
                    setPreset(value);
                  }}
                >
                  <SelectTrigger className="mx-auto mb-2 w-[180px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <div>
                <Calendar
                  mode="range"
                  onSelect={(value) => {
                    if (value?.from != null) {
                      setRange({ from: value.from, to: value.to });
                    }
                  }}
                  selected={range}
                  numberOfMonths={isSmallScreen ? 1 : 2}
                  defaultMonth={
                    new Date(
                      new Date().setMonth(
                        new Date().getMonth() - (isSmallScreen ? 0 : 1),
                      ),
                    )
                  }
                />
              </div>
            </div>
          </div>
          {!isSmallScreen && (
            <div className="flex flex-col items-end gap-1 pb-6 pr-2">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset.name}
                  preset={preset.name}
                  label={preset.label}
                  isSelected={selectedPreset === preset.name}
                  setPreset={setPreset}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 py-2 pr-4">
          <Button
            onClick={() => {
              setIsOpen(false);
              resetValues();
            }}
            $variant="ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              onUpdate?.({ range });
            }}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = "DateRangePicker";
