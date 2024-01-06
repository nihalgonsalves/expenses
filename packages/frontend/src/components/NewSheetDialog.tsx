import { CardStackIcon, CardStackPlusIcon } from '@radix-ui/react-icons';

import { usePreferredCurrencyCode } from '../state/preferences';

import { ResponsiveDialog } from './form/ResponsiveDialog';
import { CreateGroupForm } from './group-sheets/CreateGroupForm';
import { CreateSheetForm } from './personal-sheets/CreateSheetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const NewSheetDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <ResponsiveDialog title="Create new sheet" trigger={trigger}>
      <Tabs defaultValue="personal">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">
            <CardStackIcon className="mr-2" /> Personal
          </TabsTrigger>
          <TabsTrigger value="shared">
            <CardStackPlusIcon className="mr-2" /> Shared
          </TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <CreateSheetForm defaultCurrencyCode={defaultCurrencyCode} />
        </TabsContent>
        <TabsContent value="shared">
          <CreateGroupForm defaultCurrencyCode={defaultCurrencyCode} />
        </TabsContent>
      </Tabs>
    </ResponsiveDialog>
  );
};
