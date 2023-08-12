import { MdGroup, MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { SheetsResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { Avatar } from './Avatar';

export const SheetsList = ({ sheets }: { sheets: SheetsResponse }) => (
  <div className="flex flex-col gap-4">
    {sheets.length === 0 && <div className="alert">No sheets</div>}
    {sheets.map((sheet) => (
      <div key={sheet.id} className="flex items-center gap-4 h-14">
        <Link
          className="btn btn-ghost no-animation flex-grow justify-start gap-4 text-start text-xl normal-case text-primary"
          to={
            sheet.type === 'PERSONAL'
              ? `/sheets/${sheet.id}`
              : `/groups/${sheet.id}`
          }
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
    ))}
  </div>
);
