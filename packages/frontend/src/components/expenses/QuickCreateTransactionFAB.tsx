import { PlusIcon } from '@radix-ui/react-icons';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../FloatingActionButton';
import { ResponsiveDialog } from '../form/ResponsiveDialog';
import { CreateGroupSheetTransactionDialog } from '../group-sheets/CreateGroupSheetTransactionDialog';
import { CreatePersonalTransactionDialog } from '../personal-sheets/CreatePersonalTransactionDialog';
import { Button } from '../ui/button';

export const QuickCreateTransactionFAB = () => {
  const { data: sheets } = trpc.sheet.mySheets.useQuery({
    includeArchived: false,
  });

  return (
    <ResponsiveDialog
      trigger={
        <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
      }
      title="Choose a sheet"
    >
      <div className="flex flex-col gap-4 mt-2">
        {sheets?.length === 0 && 'No unarchived sheets found'}
        {sheets?.map((sheet) =>
          sheet.type === 'PERSONAL' ? (
            <CreatePersonalTransactionDialog
              key={sheet.id}
              sheetId={sheet.id}
              trigger={
                <Button className="w-full" $variant="outline">
                  {sheet.name}
                </Button>
              }
            />
          ) : (
            <CreateGroupSheetTransactionDialog
              key={sheet.id}
              sheetId={sheet.id}
              trigger={
                <Button className="w-full" $variant="outline">
                  {sheet.name}
                </Button>
              }
            />
          ),
        )}
      </div>
    </ResponsiveDialog>
  );
};
