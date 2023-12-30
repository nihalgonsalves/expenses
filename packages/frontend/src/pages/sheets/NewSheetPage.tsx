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
    <Root title="Create Sheet" className="m-auto max-w-[1200px]" showBackButton>
      <ToggleButtonGroup
        className="mb-4 grid grid-cols-2"
        options={[
          {
            label: (
              <>
                <CardStackIcon className="mr-2" /> Personal
              </>
            ),
            value: 'PERSONAL',
          },
          {
            label: (
              <>
                <CardStackPlusIcon className="mr-2" /> Shared
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
