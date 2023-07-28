import { UAParser } from 'ua-parser-js';

import { config } from '../src/config';
import { type ContextObj } from '../src/context';
import { appRouter } from '../src/router/appRouter';
import { ExpenseService } from '../src/service/expense/ExpenseService';
import { FrankfurterService } from '../src/service/frankfurter/FrankfurterService';
import { GroupService } from '../src/service/group/GroupService';
import { NotificationService } from '../src/service/notification/NotificationService';
import { UserService } from '../src/service/user/UserService';
import { type User, type JWTToken } from '../src/service/user/types';

import { getPrisma } from './getPrisma';

export const getTRPCCaller = async () => {
  const prisma = await getPrisma();

  const useCaller = (
    user: User | undefined,
    setJwtToken: (_token: JWTToken | null) => void,
  ) => {
    const userService = new UserService(prisma);
    const groupService = new GroupService(prisma);
    const notificationService = new NotificationService(prisma);
    const expenseService = new ExpenseService(prisma, notificationService);
    const frankfurterService = new FrankfurterService(
      config.FRANKFURTER_BASE_URL,
    );

    const context: ContextObj = {
      prisma,
      userService,
      groupService,
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
    useProtectedCaller: (user: User) => useCaller(user, () => {}),
  };
};
