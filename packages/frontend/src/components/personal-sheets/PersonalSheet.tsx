import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import {
  ActivityLogIcon,
  DotsVerticalIcon,
  PlusIcon,
  TimerIcon,
  TrashIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type { TransactionListItem } from "@nihalgonsalves/expenses-shared/types/transaction";

import { trpc } from "../../api/trpc";
import {
  formatDateTimeRelative,
  shortDateTimeFormatter,
} from "../../utils/temporal";
import { getTransactionDescription } from "../../utils/utils";
import { CategoryAvatar } from "../CategoryAvatar";
import { CurrencySpan } from "../CurrencySpan";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn, twx } from "../ui/utils";

import { CreatePersonalTransactionDialog } from "./CreatePersonalTransactionDialog";
import { PersonalSheetAdminSection } from "./PersonalSheetAdminSection";
import { PersonalSheetExportSection } from "./PersonalSheetExportSection";
import { PersonalSheetFormSection } from "./PersonalSheetFormSection";

const TransactionListItemComponent = ({
  transaction,
  description,
  addons,
}: {
  transaction: Pick<TransactionListItem, "category" | "description" | "money">;
  description: React.ReactNode;
  addons?: React.ReactNode;
}) => {
  const descriptionText = getTransactionDescription(transaction);
  return (
    <div
      role="listitem"
      className="flex flex-row items-center gap-2 text-sm md:gap-4"
    >
      <CategoryAvatar category={transaction.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong>{" "}
          <CurrencySpan money={transaction.money} />
        </span>
        <span>{description}</span>
      </div>
      <div className="grow" />
      {addons}
    </div>
  );
};

const TransactionScheduleDropdownMenu = ({
  sheetId,
  transactionScheduleId,
}: {
  sheetId: string;
  transactionScheduleId: string;
}) => {
  const utils = trpc.useUtils();
  const { mutateAsync: deleteTransactionSchedule } =
    trpc.transaction.deleteTransactionSchedule.useMutation();

  const handleDelete = async () => {
    await deleteTransactionSchedule({ sheetId, transactionScheduleId });
    await utils.transaction.getPersonalSheetTransactionSchedules.invalidate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button $size="icon" $variant="outline" className="bg-inherit">
          <DotsVerticalIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <ConfirmDialog
          confirmLabel="Confirm Delete"
          description="Delete transaction schedule? Existing transactions will not be affected."
          onConfirm={handleDelete}
          variant="destructive"
          trigger={
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <TrashIcon className="mr-2" /> Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CardTitleWithButton = twx(
  CardTitle,
)`flex place-items-center justify-between`;

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const { data: getPersonalSheetTransactionSchedulesResponse } =
    trpc.transaction.getPersonalSheetTransactionSchedules.useQuery({
      personalSheetId: personalSheet.id,
    });

  const addButton = (
    <CreatePersonalTransactionDialog
      sheetId={personalSheet.id}
      trigger={
        <Button $variant="outline" $size="icon">
          <AccessibleIcon label="Add Transaction">
            <PlusIcon />
          </AccessibleIcon>
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="p-2">
        <Button $variant="outline" className="w-full" asChild>
          <Link
            to={`/?${new URLSearchParams({ sheetId: personalSheet.id }).toString()}`}
          >
            <ActivityLogIcon className="mr-2" /> Transactions
          </Link>
        </Button>
      </div>
      <div className="gap-2 md:grid md:grid-cols-2 md:gap-4">
        <Card>
          <CardHeader>
            <CardTitleWithButton>
              Scheduled Transactions (
              {getPersonalSheetTransactionSchedulesResponse?.length}){" "}
              {addButton}
            </CardTitleWithButton>
          </CardHeader>
          <CardContent>
            <ScrollArea viewportClassName="max-h-96">
              <div role="list" className="flex flex-col gap-2 md:gap-4">
                {getPersonalSheetTransactionSchedulesResponse?.map(
                  (schedule) => {
                    const nextOccurrenceAt = Temporal.ZonedDateTime.from(
                      schedule.nextOccurrenceAt,
                    ).toInstant();

                    const isPast =
                      nextOccurrenceAt.epochMilliseconds <
                      Temporal.Now.instant().epochMilliseconds;

                    return (
                      <TransactionListItemComponent
                        key={schedule.id}
                        transaction={schedule}
                        description={
                          <div className={cn("flex gap-1")}>
                            <Badge variant="outline" className="capitalize">
                              {schedule.recurrenceRule.freq.toLowerCase()}
                            </Badge>

                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">
                                    {formatDateTimeRelative(
                                      nextOccurrenceAt,
                                      90,
                                    )}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="bg-muted text-muted-foreground">
                                  <p>
                                    {shortDateTimeFormatter.format(
                                      nextOccurrenceAt.epochMilliseconds,
                                    )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              {isPast && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline">
                                      <AccessibleIcon label="Pending processing">
                                        <TimerIcon />
                                      </AccessibleIcon>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-muted text-muted-foreground">
                                    <p>Pending processing</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </div>
                        }
                        addons={
                          <TransactionScheduleDropdownMenu
                            sheetId={personalSheet.id}
                            transactionScheduleId={schedule.id}
                          />
                        }
                      />
                    );
                  },
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sheet Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            <div>
              <PersonalSheetFormSection personalSheet={personalSheet} />
            </div>

            <Separator />

            <Button $variant="outline" asChild>
              <Link to={`/sheets/${personalSheet.id}/import`}>
                <UploadIcon className="mr-2" />
                Import .csv
              </Link>
            </Button>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <PersonalSheetExportSection personalSheet={personalSheet} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <PersonalSheetAdminSection personalSheet={personalSheet} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
