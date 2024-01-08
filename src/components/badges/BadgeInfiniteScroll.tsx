import { Spin, Empty } from "antd"
import { Numberify } from "bitbadgesjs-proto"
import { getMaxBadgeIdForCollection, removeUintRangeFromUintRange } from "bitbadgesjs-utils"
import { useState, useMemo } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { getCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { BatchBadgeDetails } from "../../bitbadges-api/utils/batches"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { MultiCollectionBadgeDisplay } from "./MultiCollectionBadgeDisplay"
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext"

export const BadgeInfiniteScroll = ({
  addressOrUsername,
  badgesToShow,
  cardView,
  editMode,
  hasMore,
  fetchMore,
  groupByCollection,
  isWatchlist,
  sortBy,
}: {
  addressOrUsername: string
  badgesToShow: BatchBadgeDetails[]
  cardView: boolean
  editMode: boolean
  hasMore: boolean
  fetchMore: () => Promise<void>
  groupByCollection: boolean
  isWatchlist?: boolean
  sortBy?: "oldest" | "newest" | undefined
}) => {
  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25)
  const accountInfo = useAccount(addressOrUsername)

  const numTotalBadges = useMemo(() => {
    //Calculate total number of badge IDs
    let total = 0n
    for (const obj of badgesToShow) {

      const collection = getCollection(obj.collectionId)
      if (!collection) {
        //TODO: Valid hacky way to do this, or is this going to cause issues?
        total += GO_MAX_UINT_64
        continue
      }

      //Filter out > max badge ID
      const maxBadgeId = getMaxBadgeIdForCollection(collection)

      const [remaining, _] = removeUintRangeFromUintRange(
        [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
        obj.badgeIds
      )
      obj.badgeIds = remaining

      for (const range of obj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n
        total += numBadgesInRange
      }
    }

    return Numberify(total)
  }, [badgesToShow])

  const totalNumToShow = groupByCollection ? badgesToShow.length : numTotalBadges

  if (groupByCollection) {
    badgesToShow = badgesToShow.slice(0, numBadgesDisplayed)
  }

  hasMore = hasMore || numBadgesDisplayed < totalNumToShow

  return (
    <>
      <InfiniteScroll
        dataLength={numBadgesDisplayed}
        next={async () => {
          await fetchMore()
          setNumBadgesDisplayed(numBadgesDisplayed + 25)
        }}
        hasMore={hasMore}
        loader={
          <div>
            <br />
            <Spin size={"large"} />
            <br />
            <br />
          </div>
        }
        scrollThreshold={"300px"}
        endMessage={<></>}
        initialScrollY={0}
        style={{ width: "100%", overflow: "hidden" }}
      >
        <MultiCollectionBadgeDisplay
          collectionIds={badgesToShow.map(
            (collection) => collection.collectionId
          )}
          addressOrUsernameToShowBalance={accountInfo?.address}
          cardView={cardView}
          customPageBadges={badgesToShow}
          groupByCollection={groupByCollection}
          defaultPageSize={numBadgesDisplayed}
          hidePagination={true}
          showCustomizeButtons={editMode}
          isWatchlist={isWatchlist}
          sortBy={sortBy}
        />
      </InfiniteScroll>

      {badgesToShow.every((collection) => collection.badgeIds.length === 0) &&
        !hasMore && (
          <Empty
            className="primary-text"
            description={<span>No badges found.</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
    </>
  )
}
