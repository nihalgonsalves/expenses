import { PlusIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../FloatingActionButton';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export const QuickCreateTransactionFAB = () => {
  const { data: sheets } = trpc.sheet.mySheets.useQuery({
    includeArchived: false,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose a sheet</DialogTitle>
          <DialogDescription className="flex flex-col gap-4">
            {sheets?.length === 0 && 'No unarchived sheets found'}

            {sheets?.map((sheet) => (
              <Button
                key={sheet.id}
                className="w-full"
                variant="outline"
                asChild
              >
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
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
