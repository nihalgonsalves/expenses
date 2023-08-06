import { CreateSheetForm } from '../../components/personal-sheets/CreateSheetForm';
import { usePreferredCurrencyCode } from '../../state/preferences';
import { Root } from '../Root';

export const NewSheetPage = () => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <Root title="Create Sheet" showBackButton>
      {defaultCurrencyCode && (
        <CreateSheetForm defaultCurrencyCode={defaultCurrencyCode} />
      )}
    </Root>
  );
};
