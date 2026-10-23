import type { CreateAppleWalletDraftInput } from "@nihalgonsalves/expenses-shared/types/transaction-draft";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../../create-prisma.ts";
import { TransactionDraftSource } from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";

import { parseFormattedAmount } from "./parse-formatted-amount.ts";

export class TransactionDraftService {
  private prismaClient: Pick<PrismaClientType, "transactionDraft">;

  constructor(prismaClient: Pick<PrismaClientType, "transactionDraft">) {
    this.prismaClient = prismaClient;
  }

  /**
   * Always stores the draft, even if the amount can't be parsed
   */
  async createFromAppleWallet(
    user: Pick<User, "id">,
    input: CreateAppleWalletDraftInput,
    spentAt: Date,
  ) {
    const parsed = parseFormattedAmount(input.amount);

    return this.prismaClient.transactionDraft.create({
      data: {
        id: generateId(),
        userId: user.id,
        source: TransactionDraftSource.APPLE_WALLET,
        // kept so that drafts can be re-parsed if the format changes
        rawInput: Object.fromEntries(
          Object.entries(input).filter(([, value]) => value !== undefined),
        ),
        description: input.merchant ?? null,
        amount: parsed?.amount ?? null,
        scale: parsed?.scale ?? null,
        currencyCode: parsed?.currencyCode ?? null,
        spentAt,
      },
    });
  }

  async getDrafts(user: Pick<User, "id">) {
    return this.prismaClient.transactionDraft.findMany({
      where: { userId: user.id },
      orderBy: { spentAt: "desc" },
    });
  }
}
