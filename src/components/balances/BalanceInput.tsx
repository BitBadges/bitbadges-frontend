import { Balance, MustOwnBadges, UintRange } from 'bitbadgesjs-sdk';
import { BalanceDisplay } from '../balances/BalanceDisplay';

//Just a wrapper for BalanceDisplay. Should be unified in the future

export function BalanceInput({
  balancesToShow,
  onAddBadges,
  onRemoveAll,
  collectionId,
  message,
  isMustOwnBadgesInput,
  setBalances,
  hideDisplay,
  sequentialOnly,
  fullWidthCards,
  mustOwnBadges,
  increment,
  setIncrement,
  timeString,
  numIncrements,
  suggestedBalances,
  noOffChainBalances
}: {
  balancesToShow: Balance<bigint>[],
  onAddBadges: (balance: Balance<bigint>, amountRange?: UintRange<bigint>, collectionId?: bigint, mustSatisfyForAllAssets?: boolean, overrideWithCurrentTime?: boolean) => void,
  onRemoveAll?: () => void,
  collectionId?: bigint,
  message?: string,
  isMustOwnBadgesInput?: boolean,
  setBalances?: (balances: Balance<bigint>[]) => void,
  hideDisplay?: boolean
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  mustOwnBadges?: MustOwnBadges<bigint>[]
  increment?: bigint
  timeString?: string
  setIncrement?: (increment: bigint) => void
  numIncrements?: bigint
  suggestedBalances?: Balance<bigint>[],
  noOffChainBalances?: boolean
}) {
  return <>
    <BalanceDisplay
      suggestedBalances={suggestedBalances}
      collectionId={collectionId ?? 0n}
      mustOwnBadges={mustOwnBadges}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      balances={balancesToShow}
      message={message ?? 'Balances'}
      showingSupplyPreview={message == "Circulating Supplys"}
      hideMessage={hideDisplay}
      hideBadges={hideDisplay}
      hideTable={hideDisplay}
      incrementBadgeIdsBy={increment}
      setIncrementBadgeIdsBy={setIncrement}
      numIncrements={numIncrements}

      //Edit props
      onAddBadges={onAddBadges}
      noOffChainBalances={noOffChainBalances}
      editable
      onRemoveAll={onRemoveAll}
      setBalances={setBalances}

      sequentialOnly={sequentialOnly}
      fullWidthCards={fullWidthCards}
      timeString={timeString}
    />
  </>
}