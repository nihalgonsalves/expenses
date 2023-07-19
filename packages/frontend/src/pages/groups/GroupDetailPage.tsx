import { trpc } from '../../api/trpc';
import { Group } from '../../components/Group';
import { GroupParams, useParams } from '../../router';
import { Root } from '../Root';

export const GroupDetailPage = () => {
  const { groupId } = useParams(GroupParams);
  const { data: group } = trpc.group.groupById.useQuery(groupId);

  if (!group) return null;

  return (
    <Root title={group.name} showBackButton>
      <Group group={group} />
    </Root>
  );
};
