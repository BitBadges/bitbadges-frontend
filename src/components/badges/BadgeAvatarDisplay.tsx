import { Pagination } from "antd";
import { BadgeMetadata, BitBadgeCollection, IdRange, UserBalance, getBadgeIdsToDisplayForPageNumber, getMetadataForBadgeId, updateMetadataForBadgeIdsFromIndexerIfAbsent } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { INFINITE_LOOP_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { useCollectionsContext } from "../../contexts/CollectionsContext";
import { getPageDetails } from "../../utils/pagination";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeCard } from "./BadgeCard";

export function BadgeAvatarDisplay({
  collection,
  userBalance,
  badgeIds,
  size,
  selectedId,
  showIds,
  pageSize = 10,
  showBalance,
  maxWidth = 350,
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent,
  cardView,
  hideCollectionLink
}: {
  collection: BitBadgeCollection;
  userBalance?: UserBalance;
  badgeIds: IdRange[],
  size?: number;
  pageSize?: number;
  selectedId?: number;
  showIds?: boolean;
  showBalance?: boolean;
  maxWidth?: number | string;
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>;
  cardView?: boolean;
  hideCollectionLink?: boolean;
}) {
  const collections = useCollectionsContext();

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<number[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    if (!collection) return;
    if (INFINITE_LOOP_MODE) console.log("BadgeAvatarDisplay: useEffect: collection: ", collection);

    let total = 0;
    for (const range of badgeIds) {
      const numBadgesInRange = Number(range.end) - Number(range.start) + 1;
      total += numBadgesInRange;
    }
    setTotal(total);

    const currPageDetails = getPageDetails(currPage, pageSize, 0, total - 1);
    const currPageStart = currPageDetails.start;

    //Calculate badge IDs to display and update metadata for badge IDs if absent
    const badgeIdsToDisplayResponse = getBadgeIdsToDisplayForPageNumber([
      {
        badgeIds: badgeIds,
        collection: collection
      }
    ], currPageStart, pageSize);

    const badgeIdsToDisplay: number[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    setBadgeIdsToDisplay(badgeIdsToDisplay);

    async function updateMetadata() {
      //If updateMetadataForBadgeIdsDirectlyFromUriIfAbsent is true, then update metadata by directly fetching from URI (only used when providing self-hosted metadata URIs in TxTimeline)
      //Else, we simply query our indexer
      if (updateMetadataForBadgeIdsDirectlyFromUriIfAbsent) {
        await updateMetadataForBadgeIdsDirectlyFromUriIfAbsent(badgeIdsToDisplay);
      } else {
        const idxsToUpdate = updateMetadataForBadgeIdsFromIndexerIfAbsent(badgeIdsToDisplay, collection);
        if (idxsToUpdate.length > 0) {
          await collections.updateCollectionMetadata(collection.collectionId, idxsToUpdate);
        }
      }
    }

    updateMetadata();
  }, [currPage, pageSize, badgeIds, collection, collections, updateMetadataForBadgeIdsDirectlyFromUriIfAbsent]);

  return <div style={{ maxWidth: maxWidth }}>
    <div className="flex-center">
      <Pagination
        style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT, fontSize: 14 }}
        current={currPage}
        total={total}
        pageSize={pageSize}

        onChange={(page) => {
          setCurrPage(page);
        }}
        showLessItems
        showSizeChanger={false}
        size='small'
        hideOnSinglePage
      />
    </div>
    <div className='flex-center'
      style={{
        flexWrap: 'wrap',
        overflow: 'auto',
      }} >
      <>
        <br />
        {
          badgeIdsToDisplay.map((badgeId) => {
            return <div key={badgeId} className='flex-between' style={{ margin: 2 }}>
              {!cardView ?
                <BadgeAvatar
                  size={size && selectedId === badgeId ? size * 1.5 : size}
                  collection={collection}
                  metadata={
                    getMetadataForBadgeId(badgeId, collection.badgeMetadata) || {} as BadgeMetadata
                  }
                  badgeId={badgeId}
                  balance={userBalance}
                  showId={showIds}
                  showBalance={showBalance}
                /> : <BadgeCard
                  size={size && selectedId === badgeId ? size * 1.5 : size}
                  collection={collection}
                  metadata={
                    getMetadataForBadgeId(badgeId, collection.badgeMetadata) || {} as BadgeMetadata
                  }
                  id={badgeId}
                  hideCollectionLink={hideCollectionLink}
                />
              }
            </div>
          })
        }</>
    </div>
  </div>
}