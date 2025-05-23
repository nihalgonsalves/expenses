import { describe, expect, it } from "vitest";

import { makeWaitForQueueSuccess } from "../../../test/bullMQUtils.ts";
import { personalSheetFactory, userFactory } from "../../../test/factories.ts";
import { getPrisma } from "../../../test/getPrisma.ts";
import { getRedis } from "../../../test/getRedis.ts";
import { createPersonalSheetTransactionScheduleInput } from "../../../test/input.ts";
import { closeWorker } from "../../startWorkers.ts";

import { TransactionScheduleWorker } from "./TransactionScheduleWorker.ts";
import { mapInputToCreatePersonalTransactionSchedule } from "./prismaMappers.ts";

const prisma = await getPrisma();
const redis = await getRedis();

const getWorker = async () => {
  const worker = new TransactionScheduleWorker(prisma, redis);

  return {
    worker,
    [Symbol.asyncDispose]: async () => {
      await closeWorker(worker);
    },
  };
};

describe("TransactionScheduleWorker", () => {
  it("processes transaction schedules with next occurrence timestamps in the past", async () => {
    await using useWorker = await getWorker();
    const worker = useWorker.worker;

    const waitForQueueSuccess = makeWaitForQueueSuccess(
      worker.queue.name,
      redis,
    );

    const user = await userFactory(prisma);
    const sheet = await personalSheetFactory(prisma, { withOwnerId: user.id });

    const { id } = await prisma.transactionSchedule.create({
      data: mapInputToCreatePersonalTransactionSchedule(
        {
          ...createPersonalSheetTransactionScheduleInput(
            sheet.id,
            sheet.currencyCode,
            "EXPENSE",
            100_00,
            Temporal.ZonedDateTime.from(
              "2023-01-01T00:00:00+01:00[Europe/Berlin]",
            ),
          ),
        },
        sheet,
      ),
    });

    const now = Temporal.ZonedDateTime.from(
      "2024-01-01T00:00:00+01:00[Europe/Berlin]",
    ).toInstant();

    const { returnvalue } = await waitForQueueSuccess(async () => {
      await worker.processOnce(now);
    });

    expect(returnvalue).toStrictEqual({
      now: now.toString(),
      schedulesToProcessIds: [id],
      successfulSchedules: {
        [id]: {
          created: 12,
          instances: [
            "2023-01-01T00:00:00+01:00[Europe/Berlin]",
            "2023-02-01T00:00:00+01:00[Europe/Berlin]",
            "2023-03-01T00:00:00+01:00[Europe/Berlin]",
            "2023-04-01T00:00:00+02:00[Europe/Berlin]",
            "2023-05-01T00:00:00+02:00[Europe/Berlin]",
            "2023-06-01T00:00:00+02:00[Europe/Berlin]",
            "2023-07-01T00:00:00+02:00[Europe/Berlin]",
            "2023-08-01T00:00:00+02:00[Europe/Berlin]",
            "2023-09-01T00:00:00+02:00[Europe/Berlin]",
            "2023-10-01T00:00:00+02:00[Europe/Berlin]",
            "2023-11-01T00:00:00+01:00[Europe/Berlin]",
            "2023-12-01T00:00:00+01:00[Europe/Berlin]",
          ],
          nextOccurrenceAt: "2024-01-01T00:00:00+01:00[Europe/Berlin]",
        },
      },
      failedSchedules: {},
    });

    const schedule = await prisma.transactionSchedule.findUniqueOrThrow({
      where: { id },
    });

    expect(
      Temporal.Instant.fromEpochMilliseconds(
        schedule.nextOccurrenceAt.valueOf(),
      ).equals(
        Temporal.ZonedDateTime.from(
          "2024-01-01T00:00:00+01:00[Europe/Berlin]",
        ).toInstant(),
      ),
    ).toBe(true);

    // fast-forward one month

    const now2 = Temporal.ZonedDateTime.from(
      "2024-02-01T00:00:00+01:00[Europe/Berlin]",
    ).toInstant();

    const { returnvalue: secondReturnvalue } = await waitForQueueSuccess(
      async () => {
        await worker.processOnce(
          Temporal.ZonedDateTime.from(
            "2024-02-01T00:00:00+01:00[Europe/Berlin]",
          ).toInstant(),
        );
      },
    );

    // should only create one more

    expect(secondReturnvalue).toStrictEqual({
      now: now2.toString(),
      schedulesToProcessIds: [id],
      successfulSchedules: {
        [id]: {
          created: 1,
          instances: ["2024-01-01T00:00:00+01:00[Europe/Berlin]"],
          nextOccurrenceAt: "2024-02-01T00:00:00+01:00[Europe/Berlin]",
        },
      },
      failedSchedules: {},
    });
  });

  it("processes without now set", async () => {
    await using useWorker = await getWorker();
    const worker = useWorker.worker;

    const waitForQueueSuccess = makeWaitForQueueSuccess(
      worker.queue.name,
      redis,
    );
    const { returnvalue } = await waitForQueueSuccess(async () => {
      await worker.processOnce();
    });

    expect(returnvalue).toStrictEqual({
      now: expect.any(String),
      schedulesToProcessIds: [],
      successfulSchedules: {},
      failedSchedules: {},
    });
  });
});
