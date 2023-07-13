import { ZCreateUserInput } from '../service/UserService';
import { publicProcedure, router } from '../trpc';

export const userRouter = router({
  createUser: publicProcedure
    .input(ZCreateUserInput)
    .mutation(({ input, ctx }) => ctx.userService.createUser(input)),
});
