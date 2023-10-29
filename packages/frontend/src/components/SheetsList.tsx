import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { MdGroup, MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { SheetsResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { collapse } from '../utils/framer';
import { clsxtw } from '../utils/utils';

import { Avatar } from './Avatar';
import { ExpandMoreButton } from './ExpandMoreButton';

const partitionSheets = (sheets: SheetsResponse) => {
  const personal: SheetsResponse = [];
  const group: SheetsResponse = [];
  const archived: SheetsResponse = [];

  for (const sheet of sheets) {
    if (sheet.isArchived) {
      archived.push(sheet);
    } else if (sheet.type === 'PERSONAL') {
      personal.push(sheet);
    } else {
      group.push(sheet);
    }
  }

  return { personal, group, archived };
};

const SheetItem = ({ sheet }: { sheet: SheetsResponse[0] }) => {
  const link =
    sheet.type === 'PERSONAL' ? `/sheets/${sheet.id}` : `/groups/${sheet.id}`;

  return (
    <div key={sheet.id} className="flex items-center gap-4 h-14">
      <Link
        className="btn btn-ghost no-animation flex-grow justify-start gap-4 text-start text-xl normal-case text-primary"
        to={link}
      >
        {sheet.type === 'PERSONAL' ? <MdListAlt /> : <MdGroup />}
        {sheet.name}
      </Link>
      {sheet.type === 'GROUP' && (
        <div className="avatar-group -space-x-6">
          {sheet.participants.map((participant) => (
            <Avatar key={participant.id} name={participant.name} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SheetsList = ({ sheets }: { sheets: SheetsResponse }) => {
  const { personal, group, archived } = useMemo(
    () => partitionSheets(sheets),
    [sheets],
  );

  const [showArchived, setShowArchived] = useState(false);

  return sheets.length === 0 ? (
    <div className="flex flex-col gap-4">
      <div className="alert">No sheets</div>
    </div>
  ) : (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
      {personal.length > 0 && (
        <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
          <div className="card-body">
            <h2 className="card-title">Personal Sheets</h2>
            {personal.map((sheet) => (
              <SheetItem key={sheet.id} sheet={sheet} />
            ))}
          </div>
        </div>
      )}

      {group.length > 0 && (
        <div className="flex flex-col flex-grow gap-4 card card-compact card-bordered">
          <div className="card-body">
            <h2 className="card-title">Group Sheets</h2>

            {group.map((sheet) => (
              <SheetItem key={sheet.id} sheet={sheet} />
            ))}
          </div>
        </div>
      )}

      {archived.length > 0 && (
        <div
          className={clsxtw(
            'flex flex-col flex-grow gap-4 card card-compact card-bordered',
            showArchived ? '' : 'opacity-50',
          )}
        >
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              Archived Sheets
              <ExpandMoreButton
                expand={showArchived}
                onClick={() => {
                  setShowArchived((prev) => !prev);
                }}
              />
            </h2>

            <AnimatePresence initial={false}>
              {showArchived && (
                <motion.div {...collapse}>
                  {archived.map((sheet) => (
                    <SheetItem key={sheet.id} sheet={sheet} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
