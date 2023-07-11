import { trpc } from '../api/trpc';

export const Index = () => {
  const pingResult = trpc.ping.useQuery('frontend');
  const healthResult = trpc.health.useQuery();

  return (
    <>
      Hello world.
      <pre>{JSON.stringify({ pingResult, healthResult }, null, 2)}</pre>
    </>
  );
};
