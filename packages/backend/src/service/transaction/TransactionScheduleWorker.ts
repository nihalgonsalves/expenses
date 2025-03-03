import type { Prisma } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import type IORedis from "ioredis";

import type { PrismaClientType } from "../../app";
import { TRANSACTION_SCHEDULE_BULLMQ_QUEUE } from "../../config";
import type { IWorker } from "../../startWorkers";
import { generateId } from "../../utils/nanoid";

import { getRRuleInstancesTzAware } from "./rruleUtils";

type TransactionScheduleWorkerResult = {
  now: string;
  schedulesToProcessIds: string[];
  successfulSchedules: Record<
    string,
    { created: number; instances: string[]; nextOccurrenceAt: string }
  >;
  failedSchedules: Record<string, string>;
};

export class TransactionScheduleWorker
  implements
    IWorker<{ now: string | undefined }, TransactionScheduleWorkerResult>
{
  queue: Queue<{ now: string | undefined }, TransactionScheduleWorkerResult>;

  worker: Worker<{ now: string | undefined }, TransactionScheduleWorkerResult>;

  private prisma: PrismaClientType;

  constructor(prisma: PrismaClientType, redis: IORedis) {
    this.prisma = prisma;
    this.queue = new Queue(TRANSACTION_SCHEDULE_BULLMQ_QUEUE, {
      connection: redis,
    });

    this.worker = new Worker(
      TRANSACTION_SCHEDULE_BULLMQ_QUEUE,
      async (job) =>
        this.process(
          job.data.now
            ? Temporal.Instant.from(job.data.now)
            : Temporal.Now.instant(),
        ),
      { connection: redis },
    );
  }

  async init() {
    await this.queue.add(
      "process-transaction-schedules",
      { now: undefined },
      {
        repeat: {
          // every hour
          pattern: "0 * * * *",
        },
      },
    );
  }

  async processOnce(now?: Temporal.Instant) {
    await this.queue.add("process-transaction-schedules", {
      now: now?.toString(),
    });
  }

  private async process(
    now: Temporal.Instant,
  ): Promise<TransactionScheduleWorkerResult> {
    const schedulesToProcess = await this.prisma.transactionSchedule.findMany({
      where: {
        nextOccurrenceAt: {
          lte: now.toString(),
        },
      },
      include: {
        sheet: {
          include: {
            participants: true,
          },
        },
      },
    });

    const successfulSchedules: TransactionScheduleWorkerResult["successfulSchedules"] =
      {};
    const failedSchedules: TransactionScheduleWorkerResult["failedSchedules"] =
      {};

    await Promise.all(
      schedulesToProcess.map(async (schedule) => {
        const { tzAwarePastInstances, nextOccurrenceAt } =
          getRRuleInstancesTzAware(
            schedule,
            now.toZonedDateTimeISO(schedule.nextOccurrenceTzId),
          );

        if (tzAwarePastInstances.length > 0) {
          try {
            const userId = schedule.sheet.participants.find(
              ({ role }) => role === "ADMIN",
            )?.participantId;

            if (!userId) {
              throw new Error("Unexpected schedule with no sheet admin");
            }

            const transactionInputWithIds: Prisma.TransactionCreateManyInput[] =
              tzAwarePastInstances.map((instance) => ({
                id: generateId(),
                transactionScheduleId: schedule.id,
                type: schedule.type,
                sheetId: schedule.sheetId,
                category: schedule.category,
                description: schedule.description,
                amount: schedule.amount,
                scale: schedule.scale,
                spentAt: instance.toInstant().toString(),
              }));

            const [transactions] = await this.prisma.$transaction([
              this.prisma.transaction.createMany({
                data: transactionInputWithIds,
              }),
              this.prisma.transactionEntry.createMany({
                data: transactionInputWithIds.map(
                  ({ id: transactionId, amount, scale }) => ({
                    id: generateId(),
                    transactionId,
                    userId,
                    amount,
                    scale,
                  }),
                ),
              }),
              this.prisma.transactionSchedule.update({
                where: { id: schedule.id },
                data: {
                  nextOccurrenceAt: nextOccurrenceAt.toInstant().toString(),
                },
              }),
            ]);

            successfulSchedules[schedule.id] = {
              created: transactions.count,
              nextOccurrenceAt: nextOccurrenceAt.toString(),
              instances: tzAwarePastInstances.map((instance) =>
                instance.toString(),
              ),
            };
          } catch (e) {
            failedSchedules[schedule.id] =
              e instanceof Error ? e.message : "Unknown error";
          }
        }
      }),
    );

    return {
      now: now.toString(),
      schedulesToProcessIds: schedulesToProcess.map(({ id }) => id),
      successfulSchedules,
      failedSchedules,
    };
  }
}
