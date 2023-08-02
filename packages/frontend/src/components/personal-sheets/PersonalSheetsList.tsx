import { MdListAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { type Sheet } from '@nihalgonsalves/expenses-backend';

export const PersonalSheetsList = ({ sheets }: { sheets: Sheet[] }) => {
  return (
    <div className="flex flex-col gap-4">
      {sheets.map((sheet) => (
        <Link
          key={sheet.id}
          className="btn btn-ghost no-animation btn-block h-14 justify-start gap-4 text-start text-xl normal-case text-primary"
          to={`/sheets/${sheet.id}`}
        >
          <MdListAlt />
          {sheet.name}
        </Link>
      ))}
    </div>
  );
};
