import { MdGroup } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { GroupSheetsResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { Avatar } from '../Avatar';

export const GroupSheetsList = ({
  groupSheets,
}: {
  groupSheets: GroupSheetsResponse;
}) => (
  <div className="flex flex-col gap-4">
    {groupSheets.length === 0 && <div className="alert">No groups</div>}
    {groupSheets.map((sheet) => (
      <div key={sheet.id} className="flex items-center gap-4">
        <Link
          className="btn btn-ghost no-animation flex-grow justify-start gap-4 text-start text-xl normal-case text-primary"
          to={`/groups/${sheet.id}`}
        >
          <MdGroup />
          {sheet.name}
        </Link>
        <div className="avatar-group -space-x-6">
          {sheet.participants.map((participant) => (
            <Avatar key={participant.id} name={participant.name} />
          ))}
        </div>
      </div>
    ))}
  </div>
);
