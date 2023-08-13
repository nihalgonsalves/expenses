import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { makeWaitForQueueSuccess } from '../../../test/bullMQUtils';
import { personalSheetFactory, userFactory } from '../../../test/factories';
import { getPrisma } from '../../../test/getPrisma';
import { getRedis } from '../../../test/getRedis';
import { createPersonalSheetTransactionScheduleInput } from '../../../test/input';

import { mapInputToCreatePersonalTransactionSchedule } from './prismaMappers';
import { TransactionScheduleWorker } from './worker';

const prisma = await getPrisma();
const redis = await getRedis();

describe('TransactionScheduleWorker', () => {
  it('processes transaction schedules with next occurrence timestamps in the past', async () => {
    const worker = new TransactionScheduleWorker(prisma, redis);

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
            'EXPENSE',
            100_00,
            Temporal.ZonedDateTime.from(
              '2023-01-01T00:00:00+01:00[Europe/Berlin]',
            ),
          ),
        },
        sheet,
      ),
    });

    const now = Temporal.ZonedDateTime.from(
      '2024-01-01T00:00:00+01:00[Europe/Berlin]',
    ).toInstant();

    const { returnvalue } = await waitForQueueSuccess(async () => {
      await worker.processOnce(now);
    });

    expect(returnvalue).toEqual({
      now: now.toString(),
      schedulesToProcessIds: [id],
      successfulSchedules: {
        [id]: {
          created: 12,
          instances: [
            '2023-01-01T00:00:00+01:00[Europe/Berlin]',
            '2023-02-01T00:00:00+01:00[Europe/Berlin]',
            '2023-03-01T00:00:00+01:00[Europe/Berlin]',
            '2023-04-01T00:00:00+02:00[Europe/Berlin]',
            '2023-05-01T00:00:00+02:00[Europe/Berlin]',
            '2023-06-01T00:00:00+02:00[Europe/Berlin]',
            '2023-07-01T00:00:00+02:00[Europe/Berlin]',
            '2023-08-01T00:00:00+02:00[Europe/Berlin]',
            '2023-09-01T00:00:00+02:00[Europe/Berlin]',
            '2023-10-01T00:00:00+02:00[Europe/Berlin]',
            '2023-11-01T00:00:00+01:00[Europe/Berlin]',
            '2023-12-01T00:00:00+01:00[Europe/Berlin]',
          ],
          nextOccurrenceAt: '2024-01-01T00:00:00+01:00[Europe/Berlin]',
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
          '2024-01-01T00:00:00+01:00[Europe/Berlin]',
        ).toInstant(),
      ),
    ).toBe(true);

    // fast-forward one month

    const now2 = Temporal.ZonedDateTime.from(
      '2024-02-01T00:00:00+01:00[Europe/Berlin]',
    ).toInstant();

    const { returnvalue: secondReturnvalue } = await waitForQueueSuccess(
      async () => {
        await worker.processOnce(
          Temporal.ZonedDateTime.from(
            '2024-02-01T00:00:00+01:00[Europe/Berlin]',
          ).toInstant(),
        );
      },
    );

    // should only create one more

    expect(secondReturnvalue).toEqual({
      now: now2.toString(),
      schedulesToProcessIds: [id],
      successfulSchedules: {
        [id]: {
          created: 1,
          instances: ['2024-01-01T00:00:00+01:00[Europe/Berlin]'],
          nextOccurrenceAt: '2024-02-01T00:00:00+01:00[Europe/Berlin]',
        },
      },
      failedSchedules: {},
    });
  });

  it('processes without now set', async () => {
    const worker = new TransactionScheduleWorker(prisma, redis);

    const waitForQueueSuccess = makeWaitForQueueSuccess(
      worker.queue.name,
      redis,
    );
    const { returnvalue } = await waitForQueueSuccess(async () => {
      await worker.processOnce();
    });

    expect(returnvalue).toEqual({
      now: expect.any(String),
      schedulesToProcessIds: [],
      successfulSchedules: {},
      failedSchedules: {},
    });
  });
});
