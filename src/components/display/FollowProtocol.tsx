import { Layout, Spin } from 'antd';
import 'react-markdown-editor-lite/lib/index.css';

import { InfoCircleOutlined } from '@ant-design/icons';
import { BigIntify, GetFollowDetailsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useCallback, useEffect, useState } from 'react';
import { getFollowDetails, updateFollowDetails } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { CollectionDisplayWithBadges } from '../badges/MultiCollectionBadgeDisplay';
import { EmptyIcon } from '../common/Empty';
import { Tabs } from '../navigation/Tabs';
import { SubmitMsgNewCollection } from '../tx-timelines/form-items/SubmitMsgUniversalUpdateCollection';
import { InformationDisplayCard } from './InformationDisplayCard';

import { convertMsgUniversalUpdateCollection } from "bitbadgesjs-proto";
import InfiniteScroll from 'react-infinite-scroll-component';
import { AddressDisplay } from '../address/AddressDisplay';
import { Divider } from './Divider';
import { BadgeAvatar } from '../badges/BadgeAvatar';
const template2 = require('../tx-timelines/step-items/templates/template2.json');

const { Content } = Layout;

export function FollowProtocolDisplay({ addressOrUsername }: { addressOrUsername?: string }) {
  const accountInfo = useAccount(addressOrUsername as string);

  const chain = useChainContext();


  const [followDetails, setFollowDetails] = useState<GetFollowDetailsRouteSuccessResponse<bigint>>()

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<string>('followers');

  const fetchMore = useCallback(async () => {
    setLoading(true);
    const followRes = await getFollowDetails({
      cosmosAddress: accountInfo?.cosmosAddress ?? '',
      followersBookmark: followDetails?.followersPagination?.bookmark,
      followingBookmark: followDetails?.followingPagination?.bookmark,
    });

    if (followDetails?.cosmosAddress !== followRes.cosmosAddress) {
      setFollowDetails(followRes);
    } else {


      setFollowDetails({
        ...followRes,
        followers: [...(followDetails?.followers ?? []), ...(followRes.followers ?? [])].filter((x, idx, self) => self.findIndex(y => y === x) === idx),
        followersPagination: followRes.followersPagination,
        following: [...(followDetails?.following ?? []), ...(followRes.following ?? [])].filter((x, idx, self) => self.findIndex(y => y === x) === idx),
        followingPagination: followRes.followingPagination,
      });
    }
    setLoading(false);
  }, [accountInfo, followDetails]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;
      setFollowDetails(undefined);
      await fetchAccounts([addressOrUsername as string]);

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
      fetchAccounts([...(followDetails?.followers ?? []), ...followDetails?.following ?? []]);
    }
    getFollowAccounts();
  }, [followDetails]);

  const followersPagination = followDetails?.followersPagination;
  const followingPagination = followDetails?.followingPagination;

  return (
    <Content
      className="full-area primary-text"
      style={{ minHeight: '100vh', padding: 8 }}
    >
      <br />
      {loading && <Spin size='large' />}
      <div className='flex-center'>

        {!loading && <InformationDisplayCard title={<div className='flex-center'>BitBadges Follow Protocol <BadgeAvatar collectionId={1n} badgeId={15n} /></div>} md={8} xs={24} sm={24} style={{}} subtitle={'Follow users by sending them follow badges.'}>
          <br />

          <div className='flex-center'>
            <Tabs tab={tab} setTab={setTab} tabInfo={[
              { key: 'followers', content: 'Followers' },
              { key: 'following', content: 'Following' },
              { key: 'collection', content: 'Collection' },
            ]}
              type='underline'
            />
          </div>
          <br />
          {tab === 'followers' &&
            <div className='flex-center flex-column' style={{ textAlign: 'center' }}>
              {addressOrUsername && <>
                {accountInfo?.cosmosAddress === chain.cosmosAddress && <><div className='secondary-text'>
                  <InfoCircleOutlined /> To follow a user, send them the follow badge from your respective collection.
                </div><br /></>}
                <div className='flex-center  flex-column full-width'>


                  <div className='flex-center'>
                    Followers ({followDetails?.followersCount.toString()})
                  </div>
                  {followDetails && followDetails?.followers.length > 0 &&
                    <InfiniteScroll
                      dataLength={followDetails.followers.length}
                      next={async () => {
                        await fetchMore();
                      }}
                      hasMore={followersPagination?.hasMore ?? true}
                      loader={<div>
                        <br />
                        <Spin size={'large'} />
                        <br />
                        <br />
                      </div>}
                      scrollThreshold="200px"
                      endMessage={null}
                      style={{ width: '100%' }}
                    >
                      <div className='flex-center flex-column'>
                        {followDetails.followers?.map((follower, idx) => {
                          return <AddressDisplay addressOrUsername={follower} fontSize={16} key={idx} />
                        })}
                      </div>
                    </InfiniteScroll>
                  }
                  {followDetails && followDetails?.followers.length === 0 &&
                    <div className='flex-center'>
                      <EmptyIcon description='No followers yet' />
                    </div>}
                  <br />
                </div>
              </>}
              {!addressOrUsername && <EmptyIcon description='Please select an address or username' />}
            </div>}
          {tab === 'following' &&
            <div className='flex-center flex-column' style={{ textAlign: 'center' }}>

              <div className='flex-center'>
                Following ({followDetails?.followingCount.toString()})
              </div>
              {followDetails && followDetails?.following.length > 0 &&
                <InfiniteScroll
                  dataLength={followDetails.following.length}
                  next={async () => {
                    await fetchMore();
                  }}
                  hasMore={followingPagination?.hasMore ?? true}
                  loader={<div>
                    <br />
                    <Spin size={'large'} />
                    <br />
                    <br />
                  </div>}
                  scrollThreshold="200px"
                  endMessage={null}
                  style={{ width: '100%' }}
                >
                  <div className='flex-center flex-column'>
                    {followDetails.following?.map((following, idx) => {
                      return <AddressDisplay addressOrUsername={following} fontSize={16} key={idx} />
                    })}
                  </div>
                </InfiniteScroll>
              }
              {followDetails && followDetails?.following.length === 0 &&
                <div className='flex-center'>
                  <EmptyIcon description='Not following anyone yet' />
                </div>}

              <br />
            </div>

          }




          {tab == 'collection' && <div className='' style={{ textAlign: 'center' }}>
            {followDetails && followDetails.followingCollectionId > 0n && <div className=''>
              <div className='secondary-text'>
                <InfoCircleOutlined /> This is the collection that this user uses to follow other users. Their following is determined by who owns badge ID 1.
              </div>
              <br />
              <CollectionDisplayWithBadges
                badgeObj={{
                  collectionId: followDetails?.followingCollectionId ?? 0n,
                  badgeIds: [{ start: 1n, end: 1n }]
                }}
              />
              {/* 
              <BalanceOverview collectionId={followDetails?.followingCollectionId ?? 0n} badgeId={1n} /> */}

            </div>}
            {(!followDetails || !BigInt(followDetails.followingCollectionId)) && <div className='secondary-text'>
              <EmptyIcon description='This user has not set up their follow collection yet.' />
              {chain.cosmosAddress && chain.cosmosAddress === accountInfo?.cosmosAddress && <><div className='secondary-text'>
                <InfoCircleOutlined /> You can set yours up via the template below.
              </div>
                <Divider />
                <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                  Follow Collection Template
                </div>
                <>
                  This collection will have one badge of infinite supply that you assign to who you want to follow.
                  You will always have full control over who you follow.
                  Updating your following is instant, free, and does not require any blockchain transactions
                  because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).
                  Once this collection is created, your following will be updated to this collection.
                  <br />
                  <br />
                  <BadgeAvatarDisplay collectionId={1n} badgeIds={[{ start: 1n, end: 10n }]} showIds />
                  <br />
                  <ul>
                    <li><b>Following (ID 1): </b>Give this badge to users you want to follow.</li>
                  </ul>
                </>
                <>
                  <SubmitMsgNewCollection

                    MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                      ...template2,
                      creator: chain.cosmosAddress,
                      //TODO: manager timeline?
                    }, BigIntify)}
                    afterTx={async (collectionId: bigint) => {
                      await updateFollowDetails({ followingCollectionId: collectionId });
                    }}
                  />
                </>
              </>}
            </div>}
          </div>}
        </InformationDisplayCard>}
      </div >
    </ Content >
  );
}