import { InfoCircleOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { BatchBadgeDetails, GetFollowDetailsRouteSuccessResponse } from 'bitbadgesjs-sdk';
import { useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getFollowDetails } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollectionsWithOptions } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { CollectionDisplayWithBadges } from '../badges/MultiCollectionBadgeDisplay';
import { EmptyIcon } from '../common/Empty';
import { Tabs } from '../navigation/Tabs';
import { FollowProtocolMessage, FollowProtocolSubmit } from '../tx-timelines/step-items/TemplateCollections';
import { Divider } from './Divider';
import { InformationDisplayCard } from './InformationDisplayCard';

export function FollowProtocolDisplay({ addressOrUsername }: { addressOrUsername?: string }) {
  const accountInfo = useAccount(addressOrUsername);
  const chain = useChainContext();

  const [followDetails, setFollowDetails] = useState<GetFollowDetailsRouteSuccessResponse<bigint>>();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<string>('followers');

  useEffect(() => {
    fetchCollectionsWithOptions([{ collectionId: 1n, metadataToFetch: { badgeIds: [{ start: 15n, end: 15n }] } }]);
  }, []);

  const fetchMore = useCallback(async () => {
    setLoading(true);

    if (followDetails?.followersPagination?.hasMore === false && !followDetails?.followingPagination?.hasMore) {
      setLoading(false);
      return;
    }

    const followRes = await getFollowDetails({
      cosmosAddress: accountInfo?.cosmosAddress ?? '',
      followersBookmark: followDetails?.followersPagination?.hasMore ? followDetails?.followersPagination?.bookmark : undefined,
      followingBookmark: followDetails?.followingPagination?.hasMore ? followDetails?.followingPagination?.bookmark : undefined
    });

    if (followRes.followingCollectionId) {
      await fetchCollectionsWithOptions([
        {
          collectionId: followRes.followingCollectionId,
          fetchTotalAndMintBalances: true,
          metadataToFetch: { badgeIds: [{ start: 1n, end: 1n }] }
        }
      ]);
    }

    if (followDetails?.cosmosAddress !== followRes.cosmosAddress || !followDetails) {
      setFollowDetails(followRes);
    } else {
      setFollowDetails(
        new GetFollowDetailsRouteSuccessResponse({
          ...followDetails,
          followers: [...(followDetails?.followers ?? []), ...(followRes.followers ?? [])].filter(
            (x, idx, self) => self.findIndex((y) => y === x) === idx
          ),
          followersPagination: followRes.followersPagination,
          following: [...(followDetails?.following ?? []), ...(followRes.following ?? [])].filter(
            (x, idx, self) => self.findIndex((y) => y === x) === idx
          ),
          followingPagination: followRes.followingPagination
        })
      );
    }
    setLoading(false);
  }, [accountInfo, followDetails]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;
      setFollowDetails(undefined);
      await fetchAccounts([addressOrUsername]);
    }
    getPortfolioInfo();
  }, [addressOrUsername]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get follow details');
    async function getFollowDetailsInfo() {
      if (!accountInfo) return;
      fetchMore();
    }
    getFollowDetailsInfo();
  }, [accountInfo]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get follow details');
    async function getFollowAccounts() {
      fetchAccounts([...(followDetails?.followers ?? []), ...(followDetails?.following ?? [])]);
    }
    getFollowAccounts();
  }, [followDetails]);

  const followersPagination = followDetails?.followersPagination;
  const followingPagination = followDetails?.followingPagination;

  return (
    <>
      {loading && <Spin size="large" />}
      {!loading && (
        <InformationDisplayCard
          title={<div className="flex-center">BitBadges Follow Protocol</div>}
          md={8}
          xs={24}
          sm={24}
          subtitle={'Follow users by sending them follow badges.'}>
          <br />

          <div className="flex-center">
            <Tabs
              tab={tab}
              setTab={setTab}
              tabInfo={[
                { key: 'followers', content: 'Followers' },
                { key: 'following', content: 'Following' },
                { key: 'collection', content: 'Collection' }
              ]}
              type="underline"
            />
          </div>
          <br />
          {tab === 'followers' && (
            <div className="flex-center flex-column" style={{ textAlign: 'center' }}>
              {addressOrUsername && (
                <>
                  {accountInfo?.cosmosAddress === chain.cosmosAddress && (
                    <>
                      <div className="secondary-text">
                        <InfoCircleOutlined /> To follow a user, send them the follow badge from your follow collection.
                      </div>
                      <br />
                    </>
                  )}
                  <div className="flex-center  flex-column full-width">
                    <div className="flex-center">Followers ({followDetails?.followersCount.toString()})</div>
                    {followDetails && followDetails?.followers.length > 0 && (
                      <InfiniteScroll
                        dataLength={followDetails.followers.length}
                        next={async () => {
                          await fetchMore();
                        }}
                        hasMore={followersPagination?.hasMore ?? true}
                        loader={
                          <div>
                            <br />
                            <Spin size={'large'} />
                            <br />
                            <br />
                          </div>
                        }
                        scrollThreshold="200px"
                        endMessage={null}
                        style={{ width: '100%' }}>
                        <div className="flex-center flex-column">
                          {followDetails.followers?.map((follower, idx) => {
                            return <AddressDisplay addressOrUsername={follower} fontSize={16} key={idx} />;
                          })}
                        </div>
                      </InfiniteScroll>
                    )}
                    {followDetails && followDetails?.followers.length === 0 && (
                      <div className="flex-center">
                        <EmptyIcon description="No followers yet" />
                      </div>
                    )}
                    <br />
                  </div>
                </>
              )}
              {!addressOrUsername && <EmptyIcon description="Please select an address or username" />}
            </div>
          )}
          {tab === 'following' && (
            <div className="flex-center flex-column" style={{ textAlign: 'center' }}>
              <div className="flex-center">Following ({followDetails?.followingCount.toString()})</div>
              {followDetails && followDetails?.following.length > 0 && (
                <InfiniteScroll
                  dataLength={followDetails.following.length}
                  next={async () => {
                    await fetchMore();
                  }}
                  hasMore={followingPagination?.hasMore ?? true}
                  loader={
                    <div>
                      <br />
                      <Spin size={'large'} />
                      <br />
                      <br />
                    </div>
                  }
                  scrollThreshold="200px"
                  endMessage={null}
                  style={{ width: '100%' }}>
                  <div className="flex-center flex-column">
                    {followDetails.following?.map((following, idx) => {
                      return <AddressDisplay addressOrUsername={following} fontSize={16} key={idx} />;
                    })}
                  </div>
                </InfiniteScroll>
              )}
              {followDetails && followDetails?.following.length === 0 && (
                <div className="flex-center">
                  <EmptyIcon description="Not following anyone yet" />
                </div>
              )}

              <br />
            </div>
          )}

          {tab == 'collection' && (
            <div className="" style={{ textAlign: 'center' }}>
              {followDetails && followDetails.followingCollectionId > 0n && (
                <div className="">
                  <div className="secondary-text">
                    <InfoCircleOutlined /> This is the collection that this user uses to follow other users. Their following is determined by who owns
                    badge ID 1.
                  </div>
                  <br />
                  <div className="flex-center">
                    <CollectionDisplayWithBadges
                      browseDisplay
                      hideCollectionLink
                      span={24}
                      badgeObj={
                        new BatchBadgeDetails({
                          collectionId: followDetails?.followingCollectionId ?? 0n,
                          badgeIds: [{ start: 1n, end: 1n }]
                        })
                      }
                    />
                  </div>
                </div>
              )}
              {(!followDetails || !BigInt(followDetails.followingCollectionId)) && (
                <div className="secondary-text">
                  <EmptyIcon description="This user has not set up their follow collection yet." />
                  {chain.cosmosAddress && chain.cosmosAddress === accountInfo?.cosmosAddress && (
                    <>
                      <div className="secondary-text">
                        <InfoCircleOutlined /> You can set yours up via the template below.
                      </div>
                      <Divider />
                      <div className="primary-text" style={{ fontSize: 20, fontWeight: 'bolder' }}>
                        Follow Collection Template
                      </div>
                      <FollowProtocolMessage />
                      <FollowProtocolSubmit />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </InformationDisplayCard>
      )}
    </>
  );
}
