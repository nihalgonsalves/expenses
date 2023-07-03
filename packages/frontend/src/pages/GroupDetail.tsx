import { useParams } from 'react-router-dom';
import { z } from 'zod';

import { useGroup } from '../db/splitGroup';

const ZParams = z.object({ id: z.string() });
export const GroupDetail = () => {
  const params = useParams();
  const group = useGroup(ZParams.parse(params).id);

  if (!group) return null;

  return <>{group.name}</>;
};
