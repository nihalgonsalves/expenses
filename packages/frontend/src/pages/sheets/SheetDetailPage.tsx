import { useCallback } from 'react';
import { MdCloudUpload, MdDeleteOutline, MdPlaylistAdd } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { DropdownMenu } from '../../components/DropdownMenu';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { ConfirmDialog } from '../../components/form/ConfirmDialog';
import { ExportPersonalExpensesDropdown } from '../../components/personal-sheets/ExportPersonalExpensesDropdown';
import { PersonalSheet } from '../../components/personal-sheets/PersonalSheet';
import { useParams, PersonalSheetParams } from '../../router';
import { RootLoader } from '../Root';

export const SheetDetailPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const result = trpc.sheet.personalSheetById.useQuery(sheetId);

  const navigate = useNavigate();

  const utils = trpc.useContext();
  const { mutateAsync: deleteSheet } = trpc.sheet.deleteSheet.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteSheet(sheetId);
    void utils.sheet.personalSheetById.invalidate(sheetId);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  }, [deleteSheet, sheetId, navigate, utils]);

  return (
    <RootLoader
      result={result}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
      getTitle={(sheet) => sheet.name}
      rightNavBarItems={
        <DropdownMenu aria-label="Actions">
          <li>
            <Link to={`/sheets/${sheetId}/import`}>
              <MdCloudUpload />
              Import .csv
            </Link>
          </li>

          {result.data && (
            <ExportPersonalExpensesDropdown personalSheet={result.data} />
          )}

          <ConfirmDialog
            confirmLabel="Confirm Delete"
            description="Are you sure you want to delete this sheet? This action is irreversible."
            onConfirm={handleDelete}
            renderButton={(onClick) => (
              <li>
                <a onClick={onClick}>
                  <MdDeleteOutline /> Delete Sheet
                </a>
              </li>
            )}
          />
        </DropdownMenu>
      }
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
};
