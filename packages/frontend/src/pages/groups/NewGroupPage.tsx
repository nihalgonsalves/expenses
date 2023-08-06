import { CreateGroupForm } from '../../components/group-sheets/CreateGroupForm';
import { usePreferredCurrencyCode } from '../../state/preferences';
import { Root } from '../Root';

export const NewGroupPage = () => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <Root title="Create Group" showBackButton>
      {defaultCurrencyCode && (
        <CreateGroupForm defaultCurrencyCode={defaultCurrencyCode} />
      )}
    </Root>
  );
};
