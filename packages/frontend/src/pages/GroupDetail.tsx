import { trpc } from '../api/trpc';
import { Group } from '../components/Group';
import { GroupParams, useParams } from '../router';

export const GroupDetail = () => {
  const { groupId } = useParams(GroupParams);
  const { data: group } = trpc.group.groupById.useQuery(groupId);

  if (!group) return null;

  return <Group group={group} />;
};
