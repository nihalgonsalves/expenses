import { trpc } from '../api/trpc';

export const Index = () => {
  const healthResult = trpc.health.useQuery();

  return (
    <>
      Hello world. Backend connection:{' '}
      {healthResult.isSuccess
        ? healthResult.data.message
        : healthResult.error?.message}
    </>
  );
};
