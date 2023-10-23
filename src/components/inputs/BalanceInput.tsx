import { Balance } from 'bitbadgesjs-proto';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';

export function BalanceInput({
  balancesToShow,
  onAddBadges,
  onRemoveAll,
  maximum,
  minimum,
  collectionId,
  message,
  hideOwnershipTimes,
  isMustOwnBadgesInput,
  setBalances
}: {
  balancesToShow: Balance<bigint>[],
  onAddBadges: (balance: Balance<bigint>) => void,
  onRemoveAll?: () => void,
  maximum?: bigint,
  minimum?: bigint,
  collectionId?: bigint,
  message?: string,
  hideOwnershipTimes?: boolean
  isMustOwnBadgesInput?: boolean,
  setBalances?: (balances: Balance<bigint>[]) => void
}) {
  return <>
    <BalanceDisplay
      collectionId={collectionId ?? 0n}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      balances={balancesToShow}
      message={message ?? 'Balances'}
      showingSupplyPreview={message == "Circulating Supplys"}

      //Edit props
      onAddBadges={onAddBadges}
      minimum={minimum}
      maximum={maximum}
      hideOwnershipTimeSelect={hideOwnershipTimes}
      editable
      onRemoveAll={onRemoveAll}
      setBalances={setBalances}
    />
  </>
}