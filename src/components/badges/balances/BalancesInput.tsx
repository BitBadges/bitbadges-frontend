import { Balance } from 'bitbadgesjs-proto';
import { NumberInput } from '../../display/NumberInput';
import { Numberify } from 'bitbadgesjs-utils';

export function BalancesInput({
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
        setBalances([
          {
            badgeIds: balances[0]?.badgeIds || [],
            ownershipTimes: balances[0]?.ownershipTimes || [],
            amount: 0n,
          }
        ]);
      }
      else {
        setBalances([
          {
            badgeIds: balances[0]?.badgeIds || [],
            ownershipTimes: balances[0]?.ownershipTimes || [],
            amount: BigInt(value) * (numRecipients || 1n),
          }
        ]);
      }
    }}
    title={title ? title : "Amount to Transfer"}
  />
}
