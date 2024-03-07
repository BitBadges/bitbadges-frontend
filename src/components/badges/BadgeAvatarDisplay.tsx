import { BalanceArray, BatchBadgeDetailsArray, UintRangeArray, getBalancesForId } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAndUpdateMetadata, fetchMetadataForPreview, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { Pagination } from '../common/Pagination';
import { BadgeAvatar } from './BadgeAvatar';
import { BadgeCard } from './BadgeCard';
import { MetadataAddMethod } from '../../bitbadges-api/types';

export function BadgeAvatarDisplay({
  collectionId,
  balance,
  badgeIds,
  size,
  selectedId,
  showIds,
  showSupplys,
  defaultPageSize,
  maxWidth,
  groupByCollection,

  cardView,
  hideCollectionLink,
  fetchDirectly,
  showOnSinglePage,
  fromMultiCollectionDisplay,
  showPageJumper,
  onClick,
  filterGreaterThanMax,
  sortBy,

  isWatchlist,
  showCustomizeButtons,
  addressOrUsername
}: {
  collectionId: bigint;
  balance?: BalanceArray<bigint>;
  badgeIds: UintRangeArray<bigint>;
  showSupplys?: boolean;
  size?: number;
  defaultPageSize?: number;
  selectedId?: bigint;
  showIds?: boolean;
  maxWidth?: number | string;
  cardView?: boolean;
  hideCollectionLink?: boolean;
  fetchDirectly?: boolean;
  showOnSinglePage?: boolean;
  fromMultiCollectionDisplay?: boolean;
  showPageJumper?: boolean;
  onClick?: (id: bigint) => void;
  filterGreaterThanMax?: boolean;
  sortBy?: 'oldest' | 'newest' | undefined;
  groupByCollection?: boolean;
  isWatchlist?: boolean;
  showCustomizeButtons?: boolean;
  addressOrUsername?: string;
}) {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(collectionId);
  const maxId = collection ? collection.getMaxBadgeId() : 0n;
  const [remaining, removed] = badgeIds.clone().getOverlapDetails([{ start: maxId + 1n, end: GO_MAX_UINT_64 }]);
  const inRangeBadgeIds = filterGreaterThanMax ? remaining : badgeIds;
  const total = inRangeBadgeIds.size();
  const userBalance = balance;
  const [currPage, setCurrPage] = useState<number>(1);
  const pageSize = defaultPageSize ?? (cardView ? 1 : 10);

  const badgeIdsToDisplay = useMemo(() => {
    const badgeIdsToDisplayResponse = BatchBadgeDetailsArray.From([{ badgeIds: inRangeBadgeIds.clone(), collectionId: collectionId }]).getPage(
      currPage,
      pageSize,
      sortBy
    );
    return UintRangeArray.From(badgeIdsToDisplayResponse.map((x) => x.badgeIds).flat());
  }, [inRangeBadgeIds, currPage, pageSize, collectionId, sortBy]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('BadgeAvatarDisplay: useEffect: collection: ', collectionId);

    async function updateMetadata() {
      // If from multiCollectionDisplay, then don't fetch metadata for page 1 (we assume it is fetched by the parent)
      if (fromMultiCollectionDisplay && currPage === 1) return;
      if (badgeIdsToDisplay.length === 0) return;

      //
      const fetchDirectlyFromSource = fetchDirectly ?? txTimelineContext.badgeAddMethod === MetadataAddMethod.UploadUrl;

      if (collectionId > 0n || (collectionId === 0n && fetchDirectlyFromSource)) {
        await fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay }, fetchDirectlyFromSource);
      } else if (collectionId === 0n) {
        const existingCollectionId = txTimelineContext.existingCollectionId;
        if (!existingCollectionId) return;
        await fetchMetadataForPreview(existingCollectionId, badgeIdsToDisplay, true);
      }
    }

    updateMetadata();
  }, [
    collectionId,
    txTimelineContext.existingCollectionId,
    fromMultiCollectionDisplay,
    currPage,
    fetchDirectly,
    badgeIdsToDisplay,
    txTimelineContext.badgeAddMethod
  ]);

  return (
    <div style={{ maxWidth: maxWidth, minWidth: cardView ? 200 : undefined }}>
      <Pagination
        currPage={currPage}
        onChange={setCurrPage}
        total={Number(total)}
        pageSize={pageSize}
        showOnSinglePage={showOnSinglePage}
        showPageJumper={showPageJumper}
      />
      <div key={currPage} className="flex-center flex-wrap full-width primary-text" style={{ alignItems: 'normal' }}>
        {badgeIdsToDisplay.map((badgeUintRange) => {
          const badgeIds: bigint[] = [];
          for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
            badgeIds.push(i);
          }

          if (sortBy === 'newest') {
            badgeIds.reverse();
          }

          return badgeIds.map((badgeId, idx) => {
            return (
              <div key={idx} className="flex-center flex-wrap" style={{ margin: 0, flexWrap: 'wrap', alignItems: 'normal' }}>
                {!cardView ? (
                  <BadgeAvatar
                    size={selectedId === badgeId ? 50 * 1.5 : size}
                    collectionId={collectionId}
                    badgeId={badgeId}
                    showId={showIds}
                    showSupplys={showSupplys}
                    balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
                    onClick={
                      onClick
                        ? () => {
                            onClick(badgeId);
                          }
                        : undefined
                    }
                  />
                ) : (
                  <BadgeCard
                    size={size && selectedId === badgeId ? size * 1.5 : size}
                    collectionId={collectionId}
                    badgeId={badgeId}
                    hideCollectionLink={hideCollectionLink}
                    showSupplys={showSupplys}
                    balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
                    groupedByCollection={groupByCollection}
                    showCustomizeButtons={showCustomizeButtons}
                    addressOrUsername={addressOrUsername}
                    isWatchlist={isWatchlist}
                  />
                )}
              </div>
            );
          });
        })}
      </div>

      {removed.length > 0 && filterGreaterThanMax && (
        <div className="secondary-text">
          <br />
          Badge IDs {getBadgeIdsString(removed)} have placeholder metadata or are not shown.
        </div>
      )}
    </div>
  );
}
