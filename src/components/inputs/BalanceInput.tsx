import { Balance, MustOwnBadges, UintRange } from 'bitbadgesjs-proto';
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
  setBalances,
  hideDisplay,
  sequentialOnly,
  fullWidthCards,
  mustOwnBadges,
}: {
  balancesToShow: Balance<bigint>[],
  onAddBadges: (balance: Balance<bigint>, amountRange?: UintRange<bigint>, collectionId?: bigint) => void,
  onRemoveAll?: () => void,
  maximum?: bigint,
  minimum?: bigint,
  collectionId?: bigint,
  message?: string,
  hideOwnershipTimes?: boolean
  isMustOwnBadgesInput?: boolean,
  setBalances?: (balances: Balance<bigint>[]) => void,
  hideDisplay?: boolean
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  mustOwnBadges?: MustOwnBadges<bigint>[]
}) {
  return <>
    <BalanceDisplay
      collectionId={collectionId ?? 0n}
      mustOwnBadges={mustOwnBadges}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      balances={balancesToShow}
      message={message ?? 'Balances'}
      showingSupplyPreview={message == "Circulating Supplys"}
      hideMessage={hideDisplay}
      hideBadges={hideDisplay}
      hideTable={hideDisplay}


      //Edit props
      onAddBadges={onAddBadges}
      minimum={minimum}
      maximum={maximum}
      
      hideOwnershipTimeSelect={hideOwnershipTimes}
      editable
      onRemoveAll={onRemoveAll}
      setBalances={setBalances}

      sequentialOnly={sequentialOnly}
      fullWidthCards={fullWidthCards}
    />
  </>
}