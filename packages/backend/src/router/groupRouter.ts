import { ZCreateGroupInput } from '../service/group/types';
import { protectedProcedure, router } from '../trpc';

export const groupRouter = router({
  createGroup: protectedProcedure
    .input(ZCreateGroupInput)
    .mutation(async ({ input, ctx }) =>
      ctx.groupService.createGroup(input, ctx.user),
    ),
});
