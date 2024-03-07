import { Spin, Tooltip, Typography } from 'antd';
import { BalanceArray, BatchBadgeDetailsArray, UintRangeArray, getBalancesForId } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';

import { BatchBadgeDetails } from 'bitbadgesjs-sdk';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { batchFetchAndUpdateMetadata, fetchMetadataForPreview, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { BadgeAvatar } from './BadgeAvatar';
import { BadgeAvatarDisplay } from './BadgeAvatarDisplay';
import { BadgeCard } from './BadgeCard';
import { CollectionHeader } from './CollectionHeader';

export function CollectionDisplayWithBadges({
  badgeObj,
  hideAddress = true,
  cardView,
  addressOrUsernameToShowBalance,
  hideCollectionLink,
  span,
  sortBy,
  showCustomizeButtons,
  isWatchlist,
  browseDisplay
}: {
  badgeObj: BatchBadgeDetails<bigint>;
  hideAddress?: boolean;
  cardView?: boolean;
  addressOrUsernameToShowBalance?: string;
  hideCollectionLink?: boolean;
  span?: number;
  sortBy?: 'oldest' | 'newest' | undefined;
  showCustomizeButtons?: boolean;
  isWatchlist?: boolean;
  browseDisplay?: boolean;
}) {
  const collectionId = badgeObj.collectionId;
  const collection = useCollection(collectionId);
  const account = useAccount(addressOrUsernameToShowBalance);

  const balances = account
    ? account?.getBadgeBalances(collectionId) ?? new BalanceArray<bigint>()
    : collection?.getBadgeBalances('Total') ?? new BalanceArray<bigint>();

  //In the parent display, if we haven't fetched the collection yet
  //and wnat to display all badges in the collection, we do 1-MAXUINT64 and
  //here, we filter out once we get the collection to only include in range badge IDs

  if (collection) {
    badgeObj.badgeIds.remove([{ start: collection.getMaxBadgeId() + 1n, end: GO_MAX_UINT_64 }]);
  }

  return (
    <InformationDisplayCard
      style={{ alignItems: 'normal' }}
      md={span ?? 8}
      xs={span ?? 24}
      sm={span ?? 24}
      // noBorder={!browseDisplay}
      inheritBg={!browseDisplay}>
      <Tooltip color="black" title={'Collection ID: ' + collectionId} placement="bottom">
        {browseDisplay && <CollectionHeader collectionId={collectionId} multiDisplay hideCollectionLink={hideCollectionLink} />}
        {!browseDisplay && (
          <div className="primary-text my-2" style={{ fontSize: 24, fontWeight: 'bold' }}>
            {collection?.cachedCollectionMetadata?.name}
            <br />
            <div className="secondary-text" style={{ fontSize: 16, fontWeight: 'normal' }}>
              Collection ID {collection?.collectionId.toString()}
            </div>
          </div>
        )}
        {collection && !hideAddress && (
          <div className="flex-center">
            <Typography.Text className="primary-text" style={{ fontWeight: 'bold', marginRight: 10 }}>
              By:
            </Typography.Text>
            <AddressDisplay addressOrUsername={collection.createdBy} fontSize={14} />
            <br />
          </div>
        )}
      </Tooltip>

      <BadgeAvatarDisplay
        collectionId={collectionId}
        cardView={cardView}
        balance={addressOrUsernameToShowBalance ? balances : undefined}
        badgeIds={badgeObj.badgeIds}
        hideCollectionLink={false}
        showIds
        showSupplys={!!addressOrUsernameToShowBalance}
        showOnSinglePage
        fromMultiCollectionDisplay
        sortBy={sortBy}
        groupByCollection
        showCustomizeButtons={showCustomizeButtons}
        isWatchlist={isWatchlist}
        addressOrUsername={addressOrUsernameToShowBalance}
      />
    </InformationDisplayCard>
  );
}

export function MultiCollectionBadgeDisplay({
  collectionIds,
  addressOrUsernameToShowBalance,
  cardView,
  defaultPageSize = 10,
  customPageBadges,
  groupByCollection,
  browseDisplay,
  hideCollectionLink,
  showCustomizeButtons,
  hideAddress,
  isWatchlist,
  span,
  sortBy,
  customPageName
}: {
  collectionIds: bigint[];
  addressOrUsernameToShowBalance?: string;
  cardView?: boolean;
  defaultPageSize?: number;
  groupByCollection?: boolean;
  hideCollectionLink?: boolean;
  hidePagination?: boolean;
  hideAddress?: boolean;
  showCustomizeButtons?: boolean;
  customPageBadges?: BatchBadgeDetailsArray<bigint>;
  isWatchlist?: boolean;
  span?: number;
  sortBy?: 'oldest' | 'newest' | undefined;
  browseDisplay?: boolean;
  customPageName?: string;
}) {
  const accountInfo = useAccount(addressOrUsernameToShowBalance);
  const txTimelineContext = useTxTimelineContext();
  const currPage = 1;
  const [loaded, setLoaded] = useState<boolean>(false);

  const badgesToShow = useMemo(() => {
    if (accountInfo) {
      return accountInfo?.getAccountBalancesView('badgesCollected') ?? [];
    }
    return [];
  }, [accountInfo]);

  const allBadgesToDisplay: BatchBadgeDetailsArray<bigint> = useMemo(() => {
    //If we are using this as a collection display (i.e. we want to display all badges in the collection)
    //We need to fetch the collection first
    const allBadges = new BatchBadgeDetailsArray<bigint>();

    //If we have an account to show balances for, show that accounts balances
    //Or if we have custom pages to show, show those.
    //Else, show entire collection
    if (customPageBadges) {
      allBadges.push(...customPageBadges.map((x) => x.clone()));
    } else if (accountInfo) {
      for (const collectionId of collectionIds) {
        const balances = (badgesToShow.flat() ?? []).map((x) => x.clone());

        if (balances) {
          const balanceInfo = balances.find((balance) => balance.collectionId == collectionId && balance.balances.some((bal) => bal.amount > 0n));
          for (const balance of balanceInfo?.balances || []) {
            allBadges.push({
              badgeIds: balance.badgeIds.filter((badgeId, idx) => {
                return balance.badgeIds.findIndex((badgeId2) => badgeId2.start == badgeId.start && badgeId2.end == badgeId.end) == idx;
              }),
              collectionId
            });
          }
        }
      }
    } else {
      for (const collectionId of collectionIds) {
        if (groupByCollection) {
          //We may have not fetched supply yet. We just push this so it triggers the metadata update
          //We filter out in the groupByCollection display (CollectionDisplayWithBadges)
          allBadges.push({
            badgeIds: UintRangeArray.FullRanges(),
            collectionId
          });
        }
      }
    }

    if (!groupByCollection) {
      return allBadges.getPage(currPage, defaultPageSize, sortBy).filter((x) => x.badgeIds.length > 0);
    } else {
      return allBadges;
    }
  }, [accountInfo, badgesToShow, collectionIds, customPageBadges, groupByCollection, defaultPageSize, currPage, sortBy]);

  useEffect(() => {
    async function fetchAndUpdate() {
      //Calculate badge IDs to display and update metadata for badge IDs if absent
      if (allBadgesToDisplay.length > 0) {
        const allArePreviewFetches = allBadgesToDisplay.every((x) => x.collectionId == 0n);
        if (!allArePreviewFetches) {
          await batchFetchAndUpdateMetadata(
            allBadgesToDisplay.map((x) => {
              return {
                collectionId: x.collectionId,
                metadataToFetch: {
                  badgeIds: groupByCollection ? [{ start: 1n, end: BigInt(defaultPageSize) }] : x.badgeIds
                }
              };
            })
          );
        } else {
          //Edge case where we are on the BadgesTab on an update TX timeline
          const existingCollectionId = txTimelineContext.existingCollectionId;
          await fetchMetadataForPreview(existingCollectionId, UintRangeArray.From(allBadgesToDisplay.map((x) => x.badgeIds).flat()), true);
        }
      }

      setLoaded(true);
    }

    if (INFINITE_LOOP_MODE) console.log('MultiCollectionBadgeDisplay: useEffect: badgeIdsToDisplay: ', allBadgesToDisplay);
    fetchAndUpdate();
  }, [collectionIds, groupByCollection, allBadgesToDisplay, defaultPageSize, txTimelineContext.existingCollectionId]);

  if (groupByCollection) {
    ///Little hacky way to not trigger the first fetch in BadgeAvatarDisplay in favor of the batch fetch from this file
    if (!loaded) return <Spin />;

    return (
      <>
        <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
          {allBadgesToDisplay.map((badgeObj, idx) => {
            return (
              <CollectionDisplayWithBadges
                badgeObj={badgeObj}
                hideAddress={hideAddress}
                cardView={cardView}
                addressOrUsernameToShowBalance={addressOrUsernameToShowBalance}
                hideCollectionLink={hideCollectionLink}
                key={idx}
                span={span}
                sortBy={sortBy}
                isWatchlist={isWatchlist}
                showCustomizeButtons={showCustomizeButtons}
                browseDisplay={browseDisplay}
              />
            );
          })}
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
          {allBadgesToDisplay.map((badgeIdObj) => {
            return (
              <>
                {badgeIdObj.badgeIds.map((badgeUintRange, idx) => {
                  const badgeIds: bigint[] = [];
                  for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
                    badgeIds.push(i);
                  }

                  //The getBadgesToDisplay returns the correct page according to newest
                  //However, start to end is still in increasing order which needs to be reversed
                  if (sortBy === 'newest') {
                    badgeIds.reverse();
                  }

                  return (
                    <>
                      {badgeIds.map((badgeId) => {
                        return (
                          <>
                            {cardView ? (
                              <div className="" style={{ alignItems: 'normal' }}>
                                <BadgeCard
                                  collectionId={badgeIdObj.collectionId}
                                  badgeId={badgeId}
                                  hideCollectionLink={hideCollectionLink}
                                  key={idx}
                                  showSupplys={!!addressOrUsernameToShowBalance}
                                  balances={getBalancesForId(
                                    badgeId,
                                    badgesToShow.find((collected) => collected.collectionId == badgeIdObj.collectionId)?.balances ?? []
                                  )}
                                  showCustomizeButtons={showCustomizeButtons}
                                  isWatchlist={isWatchlist}
                                  addressOrUsername={addressOrUsernameToShowBalance}
                                  currPageName={customPageName}
                                />
                              </div>
                            ) : (
                              <BadgeAvatar
                                size={100}
                                key={idx}
                                collectionId={badgeIdObj.collectionId}
                                badgeId={badgeId}
                                showSupplys={!!addressOrUsernameToShowBalance}
                                balances={getBalancesForId(
                                  badgeId,
                                  badgesToShow.find((collected) => collected.collectionId == badgeIdObj.collectionId)?.balances ?? []
                                )}
                              />
                            )}
                          </>
                        );
                      })}
                    </>
                  );
                })}
              </>
            );
          })}
        </div>
      </>
    );
  }
}
