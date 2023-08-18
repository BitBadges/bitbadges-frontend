import { Balance, UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
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
  pageSize = 10,
  maxWidth,

  cardView,
  hideCollectionLink,
  fetchDirectly,
  showOnSinglePage
}: {
  collectionId: bigint;
  addressOrUsernameToShowBalance?: string;
  balance?: Balance<bigint>[],
  badgeIds: UintRange<bigint>[];
  showSupplys?: boolean;
  size?: number;
  pageSize?: number;
  selectedId?: bigint;
  showIds?: boolean;
  maxWidth?: number | string;
  cardView?: boolean;
  hideCollectionLink?: boolean;
  fetchDirectly?: boolean;
  showOnSinglePage?: boolean;
}) {

  const collections = useCollectionsContext();

  const userBalance = balance ? balance : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

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
            })),
        collectionId: collectionId
      }
    ], currPage, pageSize);

    const badgeIdsToDisplay: UintRange<bigint>[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    setBadgeIdsToDisplay(badgeIdsToDisplay);

    async function updateMetadata() {
      if (collectionId > 0n ||
        (collectionId === 0n && fetchDirectly)
      ) {
        await collections.fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay }, fetchDirectly);
      }
    }

    updateMetadata();
  }, [badgeIds, currPage, pageSize, fetchDirectly, addressOrUsernameToShowBalance]);

  return <div style={{ maxWidth: maxWidth }}>
    <Pagination currPage={currPage} onChange={setCurrPage} total={total} pageSize={pageSize} showOnSinglePage={showOnSinglePage} />

    <>
      <div className='flex-center flex-wrap full-width primary-text'>
        {
          badgeIdsToDisplay.map((badgeUintRange) => {
            const badgeIds: bigint[] = [];

            for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
              badgeIds.push(i);
            }



            return badgeIds.map((badgeId, idx) => {
              return <div key={idx} className='flex-center flex-wrap' style={{ margin: 2, flexWrap: 'wrap' }}>
                {!cardView ?
                  <BadgeAvatar
                    size={size && selectedId === badgeId ? size * 1.5 : size}
                    collectionId={collectionId}
                    badgeId={badgeId}
                    showId={showIds}
                    showSupplys={showSupplys}
                    balances={userBalance ? getBalancesForId(badgeId, userBalance) : undefined}
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
    </>

  </div>
}