import { Empty, Spin } from "antd"
import { Numberify } from "bitbadgesjs-proto"
import { BatchBadgeDetails, getMaxBadgeIdForCollection, removeUintRangesFromUintRanges } from "bitbadgesjs-utils"
import { useMemo, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { useSelector } from "react-redux"
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext"
import { GlobalReduxState } from "../../pages/_app"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { MultiCollectionBadgeDisplay } from "./MultiCollectionBadgeDisplay"

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
  badgesToShow: BatchBadgeDetails<bigint>[]
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
  const collections = useSelector((state: GlobalReduxState) => state.collections.collections)

  const numTotalBadges = useMemo(() => {
    //Calculate total number of badge IDs
    let total = 0n
    for (const obj of badgesToShow) {

      const collection = collections[`${obj.collectionId}`]
      if (!collection) {
        total += GO_MAX_UINT_64
        continue
      }

      //Filter out > max badge ID
      const maxBadgeId = getMaxBadgeIdForCollection(collection)

      const [remaining, _] = removeUintRangesFromUintRanges(
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
  }, [badgesToShow, collections])

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
          hideCollectionLink={true}
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
