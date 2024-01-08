import type { Theme } from '@nihalgonsalves/expenses-shared/types/theme';

export const IconPreview = ({ theme }: { theme: Theme }) => (
  <div className="bg-muted grid grow place-items-center rounded-lg text-center align-middle">
    <div className="p-4 text-sm tracking-tight">
      <img
        className="size-20"
        src={`/assets/icon-normal-${theme}.svg`}
        alt="icon"
      />
      Expenses
    </div>
  </div>
);
