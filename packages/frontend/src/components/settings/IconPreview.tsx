import type { Theme } from '@nihalgonsalves/expenses-shared/types/theme';

export const IconPreview = ({ theme }: { theme: Theme }) => (
  <div className="grid grow place-items-center rounded-lg bg-muted text-center align-middle">
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
