import { useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { Dialog } from '../Dialog';
import { FloatingActionButton } from '../FloatingActionButton';

export const QuickCreateTransactionFAB = () => {
  const { data: sheets } = trpc.sheet.mySheets.useQuery({
    includeArchived: false,
  });

  const [addTransactionOpen, setAddTransactionOpen] = useState(false);

  return (
    <>
      <FloatingActionButton
        onClick={() => {
          setAddTransactionOpen(true);
        }}
        label="Add Transaction"
        icon={<MdAdd />}
      />
      <Dialog isOpen={addTransactionOpen} setIsOpen={setAddTransactionOpen}>
        <h2 className="text-xl">Choose a sheet</h2>
        {sheets?.length === 0 && (
          <div style={{ paddingBlock: '1rem' }}>No unarchived sheets found</div>
        )}
        <ul
          tabIndex={0}
          className="menu rounded-box z-[2] mt-3 bg-base-200 text-base-content p-2 text-lg shadow"
        >
          {sheets?.map((sheet) => (
            <li key={sheet.id}>
              <Link
                to={
                  sheet.type === 'PERSONAL'
                    ? `/sheets/${sheet.id}/expenses/new`
                    : `/groups/${sheet.id}/expenses/new`
                }
              >
                {sheet.name}
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};
