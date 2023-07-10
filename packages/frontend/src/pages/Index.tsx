import { trpc } from '../api/trpc';

export const Index = () => {
  const { data, isLoading } = trpc.ping.useQuery('frontend');

  return (
    <>
      Hello world. Ping result: isLoading=`{isLoading ? 'yes' : 'no'}` data=`
      {data}`
    </>
  );
};
