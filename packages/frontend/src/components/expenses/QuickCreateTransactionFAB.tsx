import { PlusIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../FloatingActionButton';
import { ResponsiveDialog } from '../form/ResponsiveDialog';
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

        {sheets?.map((sheet) => (
          <Button key={sheet.id} className="w-full" $variant="outline" asChild>
            <Link
              to={
                sheet.type === 'PERSONAL'
                  ? `/sheets/${sheet.id}/transactions/new`
                  : `/groups/${sheet.id}/transactions/new`
              }
            >
              {sheet.name}
            </Link>
          </Button>
        ))}
      </div>
    </ResponsiveDialog>
  );
};
