import { Group } from '../components/Group';
import { useGroup } from '../db/splitGroup';
import { GroupParams, useParams } from '../router';

export const GroupDetail = () => {
  const { groupId } = useParams(GroupParams);
  const group = useGroup(groupId);

  if (!group) return null;

  return <Group group={group} />;
};
