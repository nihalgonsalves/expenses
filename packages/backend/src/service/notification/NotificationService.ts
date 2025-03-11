import type { NotificationSubscriptionUpsertInput } from "@nihalgonsalves/expenses-shared/types/notification";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../../app.ts";
import { generateId } from "../../utils/nanoid.ts";

export class NotificationService {
  private prismaClient: Pick<PrismaClientType, "notificationSubscription">;

  constructor(
    prismaClient: Pick<PrismaClientType, "notificationSubscription">,
  ) {
    this.prismaClient = prismaClient;
  }

  async getSubscriptions(user: User) {
    return this.prismaClient.notificationSubscription.findMany({
      where: {
        userId: user.id,
      },
    });
  }

  async upsertSubscription(
    user: User,
    input: NotificationSubscriptionUpsertInput,
    description: string,
  ) {
    const createOrUpdate = {
      userId: user.id,
      description,

      endpoint: input.pushSubscription.endpoint,
      keyAuth: input.pushSubscription.keys.auth,
      keyP256dh: input.pushSubscription.keys.p256dh,
    };

    return this.prismaClient.notificationSubscription.upsert({
      where: {
        endpoint: input.pushSubscription.endpoint,
      },
      create: { ...createOrUpdate, id: generateId() },
      update: createOrUpdate,
    });
  }

  async deleteSubscription(user: User, id: string) {
    await this.prismaClient.notificationSubscription.delete({
      where: {
        id,
        userId: user.id,
      },
    });
  }
}
