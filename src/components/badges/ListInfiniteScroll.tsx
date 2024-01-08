import { Spin, Empty } from "antd"
import { AddressMappingWithMetadata } from "bitbadgesjs-utils"
import InfiniteScroll from "react-infinite-scroll-component"
import { AddressListCard } from "./AddressListCard"


export const ListInfiniteScroll = ({
  fetchMore,
  hasMore,
  listsView,
  addressOrUsername,
  showInclusionDisplay,
}: {
  addressOrUsername: string
  showInclusionDisplay?: boolean
  fetchMore: () => Promise<void>
  hasMore: boolean
  listsView: AddressMappingWithMetadata<bigint>[]
}) => {
  return (
    <div className="flex-center flex-wrap">
      <InfiniteScroll
        dataLength={listsView.length}
        next={fetchMore}
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
        <div className="full-width flex-center flex-wrap">
          {listsView.map((addressMapping, idx) => {
            return (
              <AddressListCard
                key={idx}
                addressMapping={addressMapping}
                addressOrUsername={addressOrUsername}
                hideInclusionDisplay={!showInclusionDisplay}
              />
            )
          })}
        </div>
      </InfiniteScroll>

      {listsView.length === 0 && !hasMore && (
        <Empty
          className="primary-text"
          description={<span>No lists found.</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  )
}