import { Empty } from 'antd';
import { BitBadgesAddressList } from 'bitbadgesjs-sdk';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ScrollLoader } from '../collection-page/ClaimAlertsTab';
import { AddressListCard } from './AddressListCard';

export const ListInfiniteScroll = ({
  fetchMore,
  hasMore,
  listsView,
  addressOrUsername,
  showInclusionDisplay,
  showCustomizeButtons,
  currPageName,
  isWatchlist,
  mustBeOnLists,
  mustNotBeOnLists
}: {
  addressOrUsername: string;
  showInclusionDisplay?: boolean;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
  showCustomizeButtons?: boolean;
  currPageName?: string;
  isWatchlist?: boolean;
  listsView: Array<BitBadgesAddressList<bigint>>;
  mustBeOnLists?: string[];
  mustNotBeOnLists?: string[];
}) => {
  return (
    <div className="flex-center flex-wrap">
      <InfiniteScroll
        dataLength={listsView.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<ScrollLoader />}
        scrollThreshold={'300px'}
        endMessage={<></>}
        initialScrollY={0}
        style={{ width: '100%', overflow: 'hidden' }}>
        <div className="full-width flex-center flex-wrap">
          {listsView.map((addressList, idx) => {
            return (
              <AddressListCard
                key={idx}
                addressList={addressList}
                addressOrUsername={addressOrUsername}
                hideInclusionDisplay={!showInclusionDisplay}
                currPageName={currPageName}
                showCustomizeButtons={showCustomizeButtons}
                isWatchlist={isWatchlist}
                showMustBeOn={mustBeOnLists?.includes(addressList.listId)}
                showMustNotBeOn={mustNotBeOnLists?.includes(addressList.listId)}
              />
            );
          })}
        </div>
      </InfiniteScroll>

      {listsView.length === 0 && !hasMore && (
        <Empty className="primary-text" description={<span>No lists found.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};
