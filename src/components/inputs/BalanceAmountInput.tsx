import { BalanceArray, Numberify } from 'bitbadgesjs-sdk';
import { NumberInput } from './NumberInput';

export function BalanceAmountInput({
  balances,
  setBalances,
  title,
  numRecipients
}: {
  balances: BalanceArray<bigint>;
  setBalances: (balances: BalanceArray<bigint>) => void;
  title?: string;
  numRecipients?: bigint;
}) {
  return (
    <NumberInput
      min={1}
      value={balances[0]?.amount < Number.MAX_SAFE_INTEGER ? Numberify(balances[0]?.amount.toString()) : 0}
      setValue={(value: number) => {
        if (!value || value <= 0) {
          setBalances(BalanceArray.From(balances.map((x) => ({ ...x, amount: 0n }))));
        } else {
          setBalances(BalanceArray.From(balances.map((x) => ({ ...x, amount: BigInt(value) * (numRecipients || 1n) }))));
        }
      }}
      title={title ? title : 'Amount to Transfer'}
    />
  );
}
