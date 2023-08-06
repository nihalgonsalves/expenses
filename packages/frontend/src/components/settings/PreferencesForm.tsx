import { trpc } from '../../api/trpc';
import { usePreferredCurrencyCode } from '../../state/preferences';
import { CurrencySelect } from '../form/CurrencySelect';

export const PreferencesForm = () => {
  const [preferredCurrencyCode, setPreferredCurrencyCode] =
    usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } =
    trpc.currencyConversion.getSupportedCurrencies.useQuery();

  return (
    <div className="card card-bordered card-compact">
      <div className="card-body">
        <h2 className="card-title">Preferences</h2>
        <CurrencySelect
          label="Preferred display currency"
          options={supportedCurrencies}
          currencyCode={preferredCurrencyCode}
          setCurrencyCode={setPreferredCurrencyCode}
        />
      </div>
    </div>
  );
};
