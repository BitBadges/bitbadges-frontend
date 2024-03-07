import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Row, Switch } from 'antd';
import { Balance, BalanceArray, TransferWithIncrements, UintRange, UintRangeArray, getBalancesAfterTransfers } from 'bitbadgesjs-sdk';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { ErrDisplay } from '../common/ErrDisplay';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { BadgeIdRangesInput } from '../inputs/BadgeIdRangesInput';
import { DateSelectWithSwitch } from '../inputs/DateRangeInput';
import { NumberInput } from '../inputs/NumberInput';
import { BalanceDisplay } from './BalanceDisplay';
import { BalancesBeforeAndAfterCard } from '../transfers/TransferOrClaimSelect';

export function BalanceDisplayEditRow({
  suggestedBalances,
  noOffChainBalances,
  collectionId,
  balances,
  onAddBadges,
  isMustOwnBadgesInput,
  message,
  defaultBalancesToShow,
  onRemoveAll,
  sequentialOnly,
  fullWidthCards,
  numRecipients = 0n,
  incrementBadgeIdsBy = 0n,
  setIncrementBadgeIdsBy,
  timeString,
  oneBalanceOnly,
  originalBalances
}: {
  collectionId: bigint;
  balances: BalanceArray<bigint>;
  numIncrements?: bigint;
  incrementBadgeIdsBy?: bigint;
  incrementOwnershipTimesBy?: bigint;
  numRecipients?: bigint;

  message?: string | ReactNode;
  size?: number;
  showingSupplyPreview?: boolean;
  noOffChainBalances?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  floatToRight?: boolean;
  isMustOwnBadgesInput?: boolean;
  editable?: boolean;
  onAddBadges?: (
    balances: Balance<bigint>,
    amountRange?: UintRange<bigint>,
    collectionId?: bigint,
    mustSatisfyForAllAssets?: boolean,
    overrideWithCurrentTime?: boolean
  ) => void;
  defaultBalancesToShow?: BalanceArray<bigint>;
  onRemoveAll?: () => void;
  sequentialOnly?: boolean;
  fullWidthCards?: boolean;
  setIncrementBadgeIdsBy?: (value: bigint) => void;
  timeString?: string;
  suggestedBalances?: BalanceArray<bigint>;
  oneBalanceOnly?: boolean;
  originalBalances?: BalanceArray<bigint>;
}) {
  const [selectIsVisible, setSelectIsVisible] = useState(oneBalanceOnly ? true : false);
  const [mustSatisfyForAllAssets, setmustSatisfyForAllAssets] = useState(true);
  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>(
    oneBalanceOnly && balances.length > 0
      ? balances[0].clone()
      : new Balance<bigint>({
          amount: 1n,
          badgeIds: [],
          ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }]
        })
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<bigint>(1n);
  const [selectedAmountRange, setSelectedAmountRange] = useState<UintRange<bigint>>(new UintRange<bigint>({ start: 1n, end: 1n }));

  const collection = useCollection(collectionId);
  const selectedCollection = useCollection(selectedCollectionId);

  const [customOwnershipTimes, setCustomOwnershipTimes] = useState<boolean>(isMustOwnBadgesInput ? false : true);

  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours());
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  //Does current badges to add cause a gap in IDs
  let nonSequential = false;
  if (sequentialOnly) {
    const currBadgeIds = UintRangeArray.From(
      collection?.owners
        .find((x) => x.cosmosAddress === 'Total')
        ?.balances?.map((x) => x.badgeIds)
        .flat() ?? []
    );
    currBadgeIds.push(...currentSupply.badgeIds);
    currBadgeIds.sortAndMerge();
    const maxBadgeId = currBadgeIds.length > 0 ? currBadgeIds[currBadgeIds.length - 1].end : 0n;
    const invertedBadgeIds = currBadgeIds.toInverted({ start: 1n, end: maxBadgeId });
    nonSequential = invertedBadgeIds.length > 0 && sequentialOnly;
  }

  const isDisabled =
    currentSupply.amount <= 0 ||
    currentSupply.badgeIds.length === 0 ||
    currentSupply.ownershipTimes.length === 0 ||
    currentSupply.ownershipTimes.hasOverlaps() ||
    currentSupply.badgeIds.hasOverlaps() ||
    nonSequential ||
    (isMustOwnBadgesInput && selectedCollection?.balancesType !== 'Standard' && noOffChainBalances);

  useEffect(() => {
    if (!oneBalanceOnly) return;
    onAddBadges?.(
      currentSupply.clone(),
      //rest are ignored unless mustOwnBadges input
      selectedAmountRange,
      selectedCollectionId,
      mustSatisfyForAllAssets,
      !customOwnershipTimes
    );
  }, [oneBalanceOnly, currentSupply, selectedAmountRange, selectedCollectionId, mustSatisfyForAllAssets, customOwnershipTimes, onAddBadges]);

  const postBalances = useMemo(() => {
    if (!collection || !originalBalances) return new BalanceArray<bigint>();
    const transfers = getBalancesAfterTransfers<bigint>(
      originalBalances,
      [
        new TransferWithIncrements({
          from: 'Mint',
          toAddresses: [],
          toAddressesLength: BigInt(numRecipients),
          balances: BalanceArray.From([currentSupply]),
          incrementBadgeIdsBy: incrementBadgeIdsBy,
          incrementOwnershipTimesBy: 0n
        })
      ],
      true
    );
    return transfers;
  }, [collection, numRecipients, currentSupply, originalBalances, incrementBadgeIdsBy]);

  return (
    <>
      {!oneBalanceOnly && (
        <tr style={{ color: currentSupply.amount < 0 ? 'red' : undefined }}>
          <td colSpan={3} className="flex" style={{ textAlign: 'center', verticalAlign: 'top', paddingRight: 4 }}>
            {(!oneBalanceOnly || (oneBalanceOnly && balances.length == 0)) && (
              <div className="flex-center">
                <IconButton
                  src={!selectIsVisible ? <PlusOutlined size={40} /> : <MinusOutlined size={40} />}
                  onClick={() => {
                    setCurrentSupply(
                      new Balance<bigint>({
                        amount: 1n,
                        badgeIds: [],
                        ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }]
                      })
                    );
                    setSelectIsVisible(!selectIsVisible);
                  }}
                  text={!selectIsVisible ? 'Add Badges' : 'Cancel'}
                  size={40}
                />
              </div>
            )}
            {!selectIsVisible && (
              <div className="flex-center">
                <IconButton
                  src={<DeleteOutlined size={40} />}
                  onClick={() => {
                    onRemoveAll?.();
                  }}
                  text="Delete All"
                  tooltipMessage="Delete All Added Badges"
                  size={40}
                />
              </div>
            )}
          </td>
        </tr>
      )}
      {selectIsVisible && (
        <>
          <Row className="flex-center full-width" style={{ alignItems: 'normal' }}>
            {isMustOwnBadgesInput && (
              <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} title={'Collection ID'}>
                <br />
                <NumberInput
                  value={Number(selectedCollectionId)}
                  setValue={(value) => {
                    setSelectedCollectionId(BigInt(value));
                  }}
                  title="Collection ID"
                  min={1}
                  max={Number.MAX_SAFE_INTEGER}
                />
                {selectedCollection?.balancesType !== 'Standard' && noOffChainBalances && (
                  <ErrDisplay err="Only collections with on-chain balances are supported." />
                )}
              </InformationDisplayCard>
            )}

            {isMustOwnBadgesInput && (
              <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} title={'Amount Range'}>
                <br />
                <NumberInput
                  value={Number(selectedAmountRange.start)}
                  setValue={(value) => {
                    setSelectedAmountRange((selectedAmountRange) => {
                      selectedAmountRange.start = BigInt(value);
                      return selectedAmountRange;
                    });
                  }}
                  title="Min Amount"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                />
                <NumberInput
                  value={Number(selectedAmountRange.end)}
                  setValue={(value) => {
                    // currentSupply.amount = BigInt(value);
                    setSelectedAmountRange((selectedAmountRange) => {
                      selectedAmountRange.end = BigInt(value);
                      return selectedAmountRange;
                    });
                  }}
                  title="Max Amount"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                />
              </InformationDisplayCard>
            )}

            {!isMustOwnBadgesInput && (
              <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} title={'Amount'}>
                <br />
                <NumberInput
                  value={Number(currentSupply.amount)}
                  setValue={(value) => {
                    setCurrentSupply((currentSupply) => {
                      return new Balance<bigint>({
                        ...currentSupply,
                        amount: BigInt(value)
                      });
                    });
                  }}
                  title="Amount"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                />
                <br />
                {numRecipients > 1 && (
                  <div className="secondary-text" style={{ fontSize: 12 }}>
                    <InfoCircleOutlined /> Each of the {numRecipients.toString()} recipients will receive x{currentSupply.amount.toString()}.
                  </div>
                )}
              </InformationDisplayCard>
            )}
            <InformationDisplayCard md={fullWidthCards ? 24 : 10} xs={24} sm={24} title={'Badge IDs'}>
              <br />
              {collection && (
                <>
                  <BadgeIdRangesInput
                    suggestedRanges={UintRangeArray.From(
                      [...(suggestedBalances?.map((x) => x.badgeIds).flat() ?? []), ...collection.getBadgeIdRange()] ?? []
                    )}
                    uintRanges={currentSupply.badgeIds}
                    setUintRanges={(uintRanges) => {
                      setCurrentSupply((currentSupply) => {
                        return new Balance<bigint>({
                          ...currentSupply,
                          badgeIds: uintRanges
                        });
                      });
                    }}
                    collectionId={isMustOwnBadgesInput ? selectedCollectionId : collectionId}
                    incrementBadgeIdsBy={!isDisabled && !isMustOwnBadgesInput ? incrementBadgeIdsBy : undefined}
                    setIncrementBadgeIdsBy={!isDisabled && !isMustOwnBadgesInput ? setIncrementBadgeIdsBy : undefined}
                    numRecipients={!isDisabled && !isMustOwnBadgesInput ? numRecipients : undefined}
                  />
                </>
              )}
            </InformationDisplayCard>
            {isMustOwnBadgesInput && currentSupply.badgeIds.size() > 1n && (
              <InformationDisplayCard md={fullWidthCards ? 24 : 4} xs={24} sm={24} title={'Requirements'}>
                <Switch
                  checkedChildren="Must Satisfy All"
                  unCheckedChildren="Must Satisfy One"
                  checked={mustSatisfyForAllAssets}
                  onChange={(checked) => {
                    setmustSatisfyForAllAssets(checked);
                  }}
                />
                <br />
                <div className="secondary-text">
                  <InfoCircleOutlined />{' '}
                  {mustSatisfyForAllAssets
                    ? 'To be approved, the requirements for ALL selected badges must be met.'
                    : 'To be approved, the requirements for ONE of the selected badges must be met.'}
                </div>
              </InformationDisplayCard>
            )}
            <InformationDisplayCard md={fullWidthCards ? 24 : 10} xs={24} sm={24} title={'Ownership Times'}>
              {isMustOwnBadgesInput && (
                <>
                  <Switch
                    checked={!customOwnershipTimes}
                    checkedChildren={timeString ?? 'Transfer Time'}
                    unCheckedChildren="Specific Times"
                    onChange={(checked) => {
                      setCustomOwnershipTimes(!checked);
                    }}
                  />
                  <br />
                </>
              )}

              {customOwnershipTimes && (
                <>
                  <DateSelectWithSwitch
                    timeRanges={currentSupply.ownershipTimes}
                    setTimeRanges={(timeRanges) => {
                      setCurrentSupply(new Balance<bigint>({ ...currentSupply, ownershipTimes: timeRanges }));
                    }}
                    suggestedTimeRanges={UintRangeArray.From(
                      [...(suggestedBalances ?? []), ...(defaultBalancesToShow ?? [])]?.map((x) => x.ownershipTimes).flat() ?? []
                    )}
                    helperMessage={
                      message == 'Circulating Supplys'
                        ? 'Badges are ownable (circulating) at all times.'
                        : 'Ownership of the selected badges is to be transferred for all times.'
                    }
                  />
                </>
              )}
              {isMustOwnBadgesInput && (
                <>
                  <br />
                  <div className="secondary-text">
                    <InfoCircleOutlined style={{ color: 'orange' }} /> Be mindful of the possibility of flash ownership attacks. For example, one user
                    is successful then immediately transfers the badge to another user who is also successful. See here to{' '}
                    <a href="https://blockin.gitbook.io/blockin/developer-docs/core-concepts#security-flash-ownership-attacks" target="_blank">
                      learn more
                    </a>
                    .
                  </div>
                </>
              )}
            </InformationDisplayCard>
          </Row>

          {!isDisabled && !isMustOwnBadgesInput && numRecipients && originalBalances && (
            <Row className="flex-center full-width" style={{ alignItems: 'normal' }}>
              <InformationDisplayCard
                md={fullWidthCards ? 24 : 12}
                xs={24}
                sm={24}
                title={'Selected Transfers'}
                subtitle={'Use the navigator to see what the Nth transfer looks like.'}>
                <br />
                <BalanceDisplay
                  collectionId={collectionId}
                  balances={!isDisabled ? BalanceArray.From([currentSupply]) : new BalanceArray<bigint>()}
                  message={''}
                  hideMessage
                  isMustOwnBadgesInput={isMustOwnBadgesInput}
                  editable={false}
                  incrementBadgeIdsBy={incrementBadgeIdsBy}
                  numIncrements={numRecipients}
                />
              </InformationDisplayCard>
              <BalancesBeforeAndAfterCard
                title="Before / After Balances"
                subtitle="Balances before and after all transfers are applied."
                originalBalances={originalBalances}
                collectionId={collectionId}
                postBalances={postBalances}
                md={12}
              />
            </Row>
          )}
          <div
            style={{
              textAlign: 'center',
              verticalAlign: 'top',
              paddingRight: 4
            }}
            className="full-width">
            {!oneBalanceOnly && (
              <button
                className="landing-button full-width  mt-4"
                style={{ width: '100%' }}
                disabled={isDisabled}
                onClick={() => {
                  onAddBadges?.(
                    currentSupply.clone(),
                    //rest are ignored unless mustOwnBadges input
                    selectedAmountRange,
                    selectedCollectionId,
                    mustSatisfyForAllAssets,
                    !customOwnershipTimes
                  );

                  setCurrentSupply(
                    new Balance<bigint>({
                      amount: 1n,
                      badgeIds: [],
                      ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }]
                    })
                  );

                  setSelectIsVisible(false);
                }}>
                Add Badges
              </button>
            )}
            <span style={{ color: 'red' }}>
              {isDisabled && nonSequential
                ? 'Badge IDs must be sequential starting from 1 (no gaps).'
                : isDisabled
                  ? 'All options must be non-empty and have no errors.'
                  : ''}
            </span>
          </div>
        </>
      )}
    </>
  );
}
