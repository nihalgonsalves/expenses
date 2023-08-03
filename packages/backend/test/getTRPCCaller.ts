import { UAParser } from 'ua-parser-js';

import { config } from '../src/config';
import type { ContextObj } from '../src/context';
import { appRouter } from '../src/router';
import { ExpenseService } from '../src/service/expense/service';
import { FrankfurterService } from '../src/service/frankfurter/FrankfurterService';
import { NotificationService } from '../src/service/notification/service';
import { SheetService } from '../src/service/sheet/service';
import { UserService } from '../src/service/user/service';
import type { User, JWTToken } from '../src/service/user/types';

import { getPrisma } from './getPrisma';

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => void,
  ) => {
    const userService = new UserService(prisma);
    const sheetService = new SheetService(prisma);
    const notificationService = new NotificationService(prisma);
    const expenseService = new ExpenseService(prisma, notificationService);
    const frankfurterService = new FrankfurterService(
      config.FRANKFURTER_BASE_URL,
    );

    const context: ContextObj = {
      prisma,
      userService,
      sheetService,
      expenseService,
      notificationService,
      frankfurterService,
      user,
      get userAgent() {
        return new UAParser(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15',
        ).getResult();
      },
      setJwtToken,
    };

    return appRouter.createCaller(context);
  };

  return {
    prisma,
    usePublicCaller: (setJwtToken = (_token: JWTToken | null) => {}) =>
      useCaller(undefined, setJwtToken),
    useProtectedCaller: (
      user: User,
      setJwtToken = (_token: JWTToken | null) => {},
    ) => useCaller(user, setJwtToken),
  };
};
