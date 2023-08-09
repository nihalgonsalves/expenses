import { useState } from 'react';
import { MdGroup, MdPerson } from 'react-icons/md';

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
                <MdPerson /> Personal
              </>
            ),
            value: 'PERSONAL',
          },
          {
            label: (
              <>
                <MdGroup /> Shared
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
