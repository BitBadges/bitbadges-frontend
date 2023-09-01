import { Balance, UintRange, deepCopy } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalancesForId, getMetadataDetailsForBadgeId, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useRef, useState } from "react";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID, useTxTimelineContext } from "../../bitbadges-api/contexts/TxTimelineContext";
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

  cardView,
  hideCollectionLink,
  fetchDirectly,
  showOnSinglePage,
  lightTheme,
  doNotFetchMetadata,
  doNotAdaptToWidth
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
  doNotAdaptToWidth?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();

  const userBalance = balance ? balance : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(defaultPageSize); //Total number of badges in badgeIds[]
  const [pageSize, setPageSize] = useState<number>(defaultPageSize); //Number of badges to display per page

  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<UintRange<bigint>[]>([]); // Badge IDs to display of length pageSize


  useEffect(() => {
    let newPageSize = pageSize;
    if (!doNotAdaptToWidth) {
      if (divRef.current && !cardView) {
        const divWidth = divRef.current.offsetWidth as any;
        newPageSize = 3 * Math.floor(divWidth / 58); // Adjust as needed
      } else if (divRef.current && cardView) {
        const divWidth = divRef.current.offsetWidth as any;
        newPageSize = Math.floor(divWidth / 220); // Adjust as needed
      }
    }
    setPageSize(newPageSize);

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
    ], currPage, newPageSize);

    const badgeIdsToDisplay: UintRange<bigint>[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    setBadgeIdsToDisplay(badgeIdsToDisplay);

    async function updateMetadata() {
      if (doNotFetchMetadata) return;

      if (collectionId > 0n ||
        (collectionId === 0n && fetchDirectly)
      ) {
        await collections.fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay }, fetchDirectly);
      } else if (collectionId === 0n) {
        const existingCollectionId = txTimelineContext.existingCollectionId;
        const currPreviewCollection = collections.collections[MSG_PREVIEW_ID.toString()];
        if (!currPreviewCollection) return;

        //We don't want to overwrite any edited metadata
        //Should prob do this via a range implementation but badgeIdsToDisplay should only be max len of pageSize
        let badgeIdsToFetch = deepCopy(badgeIdsToDisplay);
        for (const badgeIdRange of badgeIdsToDisplay) {
          for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
            const badgeId = i;
            const currMetadata = getMetadataDetailsForBadgeId(badgeId, currPreviewCollection.cachedBadgeMetadata);
            if (currMetadata && currMetadata.toUpdate && !currMetadata.uri) {
              //We have edited this badge and it is not a placeholder (bc it would have "Placeholder" as URI)
              //Remove badgeId from badgeIdsToFetch
              const [remaining,] = removeUintRangeFromUintRange([{ start: badgeId, end: badgeId }], badgeIdsToFetch);
              badgeIdsToFetch = remaining;
            }
          }
        }

        if (existingCollectionId && badgeIdsToFetch.length > 0) {
          const prevMetadata = deepCopy(collections.collections[existingCollectionId.toString()]?.cachedBadgeMetadata);
          const res = await collections.fetchAndUpdateMetadata(existingCollectionId, { badgeIds: badgeIdsToFetch }, fetchDirectly);
          let newBadgeMetadata = res[0].cachedBadgeMetadata;

          if (newBadgeMetadata && JSON.stringify(newBadgeMetadata) !== JSON.stringify(prevMetadata)) {

            if (currPreviewCollection) {
              //Only update newly fetched metadata
              for (const metadata of newBadgeMetadata) {
                const [, removed] = removeUintRangeFromUintRange(badgeIdsToFetch, metadata.badgeIds);
                metadata.badgeIds = removed;
              }
              newBadgeMetadata = newBadgeMetadata.filter(metadata => metadata.badgeIds.length > 0);

              collections.updateCollection({
                ...currPreviewCollection,
                cachedBadgeMetadata: newBadgeMetadata.filter(metadata => metadata.badgeIds.length > 0),
                cachedCollectionMetadata: res[0].cachedCollectionMetadata,
              });
            }
          }
        }
      }
    }

    updateMetadata();
  }, [badgeIds, currPage, divRef.current, fetchDirectly, addressOrUsernameToShowBalance, cardView]);

  //Calculate pageSize based on the width of this componetnt
  
  return <div style={{ maxWidth: maxWidth, minWidth: cardView ? 200 : undefined }} >
    <Pagination currPage={currPage} onChange={setCurrPage} total={total} pageSize={pageSize} showOnSinglePage={showOnSinglePage} lightTheme={lightTheme} />

    <>
      <div className='flex-center flex-wrap full-width primary-text' ref={divRef}>
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