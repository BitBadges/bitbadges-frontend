import { Balance, UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useMemo, useState } from "react";
import { useTxTimelineContext } from "../../bitbadges-api/contexts/TxTimelineContext";

import { getTotalNumberOfBadges } from "../../bitbadges-api/utils/badges";
import { INFINITE_LOOP_MODE, } from "../../constants";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { Pagination } from "../common/Pagination";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeCard } from "./BadgeCard";
import { getBadgeIdsString } from "../../utils/badgeIds";
import { fetchAndUpdateMetadata, fetchMetadataForPreview, useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";

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

  cardView,
  hideCollectionLink,
  fetchDirectly,
  showOnSinglePage,
  fromMultiCollectionDisplay,
  // doNotAdaptToWidth,
  showPageJumper,
  onClick,
  filterGreaterThanMax,
}: {
  collectionId: bigint;
  balance?: Balance<bigint>[],
  badgeIds: UintRange<bigint>[];
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
  // doNotAdaptToWidth?: boolean;
  showPageJumper?: boolean
  onClick?: (id: bigint) => void,
  filterGreaterThanMax?: boolean
}) {

  const collection = useCollection(collectionId);
  const maxId = collection ? getTotalNumberOfBadges(collection) : 0n;
  const [remaining, removed] = removeUintRangeFromUintRange([{ start: maxId + 1n, end: GO_MAX_UINT_64 }], badgeIds)

  const inRangeBadgeIds = filterGreaterThanMax ? remaining : badgeIds;
  const txTimelineContext = useTxTimelineContext();
  const userBalance = balance;
  const [currPage, setCurrPage] = useState<number>(1);
  const pageSize = defaultPageSize ?? (cardView ? 2 : 10);


  const total = useMemo(() => {
    let total = 0;
    for (const range of inRangeBadgeIds) {
      const numBadgesInRange = Numberify(range.end) - Numberify(range.start) + 1;
      total += numBadgesInRange;
    }
    return total;
  }, [inRangeBadgeIds]);


  const badgeIdsToDisplay = useMemo(() => {

    const badgeIdsToDisplayResponse = getBadgesToDisplay([
      {
        badgeIds:
          sortUintRangesAndMergeIfNecessary(
            inRangeBadgeIds.filter((badgeId, idx) => {
              return inRangeBadgeIds.findIndex(badgeId2 => badgeId2.start === badgeId.start && badgeId2.end === badgeId.end) === idx;
            }), true),
        collectionId: collectionId
      }
    ], currPage, pageSize);

    const badgeIdsToDisplay: UintRange<bigint>[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    return badgeIdsToDisplay;
  }, [inRangeBadgeIds, currPage, pageSize, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("BadgeAvatarDisplay: useEffect: collection: ", collectionId);

    async function updateMetadata() {

      if (fromMultiCollectionDisplay && currPage === 1) return;
      if (badgeIdsToDisplay.length === 0) return;

      if (collectionId > 0n || (collectionId === 0n && fetchDirectly)) {
        await fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay }, fetchDirectly);
      } else if (collectionId === 0n) {
        const existingCollectionId = txTimelineContext.existingCollectionId;
        if (!existingCollectionId) return;
        await fetchMetadataForPreview(existingCollectionId, badgeIdsToDisplay, true);
      }
    }

    updateMetadata();
  }, [collectionId, txTimelineContext.existingCollectionId, fromMultiCollectionDisplay, currPage, fetchDirectly, badgeIdsToDisplay]);

  //Calculate pageSize based on the width of this componetnt
  return <div style={{ maxWidth: maxWidth, minWidth: cardView ? 200 : undefined }} >
    <Pagination currPage={currPage} onChange={setCurrPage} total={total} pageSize={pageSize} showOnSinglePage={showOnSinglePage}
      showPageJumper={showPageJumper}
    />


    <div key={currPage} className='flex-center flex-wrap full-width primary-text'>
      {
        badgeIdsToDisplay.map((badgeUintRange) => {
          const badgeIds: bigint[] = [];
          for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
            badgeIds.push(i);
          }

          return badgeIds.map((badgeId, idx) => {
            return <div key={idx} className='flex-center flex-wrap' style={{ margin: 0, flexWrap: 'wrap' }}>
              {!cardView ?
                <BadgeAvatar
                  size={selectedId === badgeId ? 50 * 1.5 : size}
                  collectionId={collectionId}
                  badgeId={badgeId}
                  showId={showIds}
                  showSupplys={showSupplys}
                  balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
                  onClick={onClick ? () => { onClick(badgeId) } : undefined}
                /> : <BadgeCard
                  size={size && selectedId === badgeId ? size * 1.5 : size}
                  collectionId={collectionId}
                  badgeId={badgeId}
                  hideCollectionLink={hideCollectionLink}
                  showSupplys={showSupplys}
                  balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
                />
              }
            </div>
          })
        })
      }
    </div>

    {removed.length > 0 && <div className="secondary-text">
      <br />
      Badge IDs {getBadgeIdsString(removed)} have placeholder metadata.
    </div>}
  </div>
}