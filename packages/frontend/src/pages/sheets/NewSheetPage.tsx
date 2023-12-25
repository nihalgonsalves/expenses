import { CardStackIcon, CardStackPlusIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import type { SheetType } from '@nihalgonsalves/expenses-shared/types/sheet';

import { ToggleButtonGroup } from '../../components/form/ToggleButtonGroup';
import { CreateGroupForm } from '../../components/group-sheets/CreateGroupForm';
import { CreateSheetForm } from '../../components/personal-sheets/CreateSheetForm';
import { usePreferredCurrencyCode } from '../../state/preferences';
import { Root } from '../Root';

export const NewSheetPage = () => {
  const [type, setType] = useState<SheetType>('PERSONAL');
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <Root title="Create Sheet" showBackButton>
      <ToggleButtonGroup
        className="mb-4"
        options={[
          {
            label: (
              <>
                <CardStackIcon /> Personal
              </>
            ),
            value: 'PERSONAL',
          },
          {
            label: (
              <>
                <CardStackPlusIcon /> Shared
              </>
            ),
            value: 'GROUP',
          },
        ]}
        value={type}
        setValue={setType}
      />
      {defaultCurrencyCode && type === 'PERSONAL' && (
        <CreateSheetForm defaultCurrencyCode={defaultCurrencyCode} />
      )}
      {defaultCurrencyCode && type === 'GROUP' && (
        <CreateGroupForm defaultCurrencyCode={defaultCurrencyCode} />
      )}
    </Root>
  );
};
