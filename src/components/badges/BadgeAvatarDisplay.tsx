import { Balance, UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useTxTimelineContext } from "../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE, } from "../../constants";
import { Pagination } from "../common/Pagination";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeCard } from "./BadgeCard";

export function BadgeAvatarDisplay({
  collectionId,
  addressOrUsernameToShowBalance,
  balance,
  badgeIds,
  size,
  selectedId,
  showIds,
  showSupplys = true,
  defaultPageSize = 10,
  maxWidth,
  noBorder,

  cardView,
  hideCollectionLink,
  fetchDirectly,
  showOnSinglePage,
  lightTheme,
  doNotFetchMetadata,
  // doNotAdaptToWidth,
  showPageJumper,
  onClick
}: {
  collectionId: bigint;
  addressOrUsernameToShowBalance?: string;
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
  lightTheme?: boolean;
  doNotFetchMetadata?: boolean;
  // doNotAdaptToWidth?: boolean;
  noBorder?: boolean;
  showPageJumper?: boolean
  onClick?: (id: bigint) => void
}) {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();

  const userBalance = balance ? balance : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]
  const pageSize = defaultPageSize;

  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<UintRange<bigint>[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("BadgeAvatarDisplay: useEffect: collection: ", collectionId);


    let total = 0;
    for (const range of badgeIds) {
      const numBadgesInRange = Numberify(range.end) - Numberify(range.start) + 1;
      total += numBadgesInRange;
    }
    setTotal(total);

    //Remove duplicates
    //Calculate badge IDs to display and update metadata for badge IDs if absent
    const badgeIdsToDisplayResponse = getBadgesToDisplay([
      {
        badgeIds:
          sortUintRangesAndMergeIfNecessary(
            badgeIds.filter((badgeId, idx) => {
              return badgeIds.findIndex(badgeId2 => badgeId2.start === badgeId.start && badgeId2.end === badgeId.end) === idx;
            }), true),
        collectionId: collectionId
      }
    ], currPage, pageSize);

    const badgeIdsToDisplay: UintRange<bigint>[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    setBadgeIdsToDisplay(badgeIdsToDisplay);

    async function updateMetadata() {
      if (doNotFetchMetadata) return;

      if (collectionId > 0n || (collectionId === 0n && fetchDirectly)) {
        await collections.fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay }, fetchDirectly);
      } else if (collectionId === 0n) {
        const existingCollectionId = txTimelineContext.existingCollectionId;
        if (!existingCollectionId) return;
        await collections.fetchMetadataForPreview(existingCollectionId, badgeIdsToDisplay, true);
      }
    }

    updateMetadata();
  }, [badgeIds, currPage, fetchDirectly, addressOrUsernameToShowBalance, cardView]);

  //Calculate pageSize based on the width of this componetnt
  return <div style={{ maxWidth: maxWidth, minWidth: cardView ? 200 : undefined }} >
    <Pagination currPage={currPage} onChange={setCurrPage} total={total} pageSize={pageSize} showOnSinglePage={showOnSinglePage} lightTheme={lightTheme}
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
                  noBorder={noBorder}
                  showSupplys={showSupplys}
                  balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
                  onClick={onClick ? () => { onClick(badgeId) } : undefined}
                /> : <BadgeCard
                  size={size && selectedId === badgeId ? size * 1.5 : size}
                  collectionId={collectionId}
                  badgeId={badgeId}
                  hideCollectionLink={hideCollectionLink}
                />
              }
            </div>
          })
        })
      }
    </div>

  </div>
}