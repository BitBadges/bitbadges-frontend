import { Balance } from 'bitbadgesjs-sdk';
import { NumberInput } from './NumberInput';
import { Numberify } from 'bitbadgesjs-sdk';

export function BalanceAmountInput({
  balances,
  setBalances,
  title,
  numRecipients,
}: {
  balances: Balance<bigint>[],
  setBalances: (balances: Balance<bigint>[]) => void,
  title?: string,
  numRecipients?: bigint
}) {
  return <NumberInput
    min={1}
    value={balances[0]?.amount < Number.MAX_SAFE_INTEGER ? Numberify(balances[0]?.amount.toString()) : 0}
    setValue={(value: number) => {
      if (!value || value <= 0) {
        setBalances(
          balances.map((balance) => {
            return {
              ...balance,
              amount: 0n,
            };
          })
        );
      }
      else {
        setBalances(
          balances.map((balance) => {
            return {
              ...balance,
              amount: BigInt(value) * (numRecipients || 1n),
            };
          })
        );
      }
    }}
    title={title ? title : "Amount to Transfer"}
  />
}
