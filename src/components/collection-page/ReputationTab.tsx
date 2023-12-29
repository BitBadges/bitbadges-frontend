import { Button, Col, Divider, Empty, Input, Row, Spin, Tooltip, Typography } from 'antd';
import { Numberify, ReviewDoc } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactStars from "react-stars";
import { addReviewForCollection, addReviewForUser, deleteReview } from '../../bitbadges-api/api';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';


import { DeleteOutlined } from '@ant-design/icons';
import { fetchAccounts, fetchNextForAccountViews, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';


export function ReputationTab({ reviews, collectionId, addressOrUsername, fetchMore, hasMore }:
  {
    addressOrUsername?: string,
    reviews: ReviewDoc<bigint>[];
    collectionId?: bigint,
    fetchMore: () => Promise<void>,
    hasMore: boolean
  }
) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);
  // const signedInAccount = useAccount(chain.address);

  const currAccount = useAccount(addressOrUsername ? addressOrUsername : collection?.aliasAddress);
  // const accountInfo = currAccount;

  const [newReview, setNewReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(5);

  // const [followDetails, setFollowDetails] = useState<GetFollowDetailsRouteSuccessResponse<bigint>>();

  // const [experiencesProtocolCollectionId, setExperiencesProtocolCollectionId] = useState<bigint>(BigInt(0));
  
  // useEffect(() => {
  //   if (!currAccount?.cosmosAddress) return;
  //   getFollowDetails({ cosmosAddress: currAccount.cosmosAddress, protocol: "Experiences Protocol" }).then(setFollowDetails);
  // }, [currAccount?.cosmosAddress]);

  // console.log(followDetails);

  // useEffect(() => {
  //   if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch collection');
  //   async function fetchCollection() {
  //     if (!chain.address || !collectionId) return;
  //     if (!currAccount?.address) return;
      
  //     const res = await getCollectionForProtocol({ name: "Experiences Protocol", address: chain.address });
  //     setExperiencesProtocolCollectionId(res.collectionId);

  //     const currAddress = currAccount.address;
  //     await fetchBalanceForUser(collectionId, currAddress);
  //   }
  //   fetchCollection();
  // }, [experiencesProtocolCollectionId, signedInAccount, currAccount, chain.address, collectionId]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch accounts');
    const accountsToFetch: string[] = reviews.map(r => r.from);
    fetchAccounts(accountsToFetch);
  }, [reviews]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch more');
    if (hasMore) fetchMore();
  }, [fetchMore, hasMore])

  // const currBalances = currAccount?.collected?.find(x => x.collectionId === collectionId)?.balances ?? [];

  
  

  // const addToExperiencesProtocol = async (badgeId: bigint) => {
  //   if (loading || !accountInfo?.cosmosAddress) return;
  //   const isCurrentlySet = getBalancesForId(badgeId, currBalances).some(x => x.amount > 0n);  

  //   if (isCurrentlySet) {
  //     notification.success({
  //       message: 'Success',
  //       description: 'This is already set.',
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   if (experiencesProtocolCollectionId <= 0) {
  //     message.error('You must set up a follow collection before following users. Go to Create -> Badge Collection -> Template -> Follow Collection.');
  //     setLoading(false);
  //     return;
  //   }

  //   let protocolCollection = getCollection(experiencesProtocolCollectionId);
  //   if (!protocolCollection) {
  //     const res = await getCollectionById(experiencesProtocolCollectionId, {}, true);
  //     protocolCollection = res.collection;
  //   }

  //   if (protocolCollection.balancesType !== 'Off-Chain - Indexed' || protocolCollection.offChainBalancesMetadataTimeline.length === 0 || !protocolCollection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges-balances.nyc3.digitaloceanspaces.com/balances/')) {
  //     message.error('Your follow collection is custom created. To follow users, you must send them the respective follow badge manually.');
  //     setLoading(false);
  //     return;
  //   }

  //   const offChainBalancesMapRes = await fetchMetadataDirectly({
  //     uris: [protocolCollection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri]
  //   });

  //   //filter undefined entries
  //   const filteredMap = Object.entries(offChainBalancesMapRes.metadata[0] as any).filter(([, balances]) => {
  //     return !!balances;
  //   }).reduce((obj, [cosmosAddress, balances]) => {
  //     obj[cosmosAddress] = balances;
  //     return obj;
  //   }, {} as any);

  //   const balancesMap = convertOffChainBalancesMap(filteredMap as any, BigIntify)
  //   const transfers: TransferWithIncrements<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
  //     return {
  //       from: 'Mint',
  //       toAddresses: [cosmosAddress],
  //       balances,
  //     }
  //   });
  //   transfers.push({
  //     from: 'Mint',
  //     toAddresses: [accountInfo?.cosmosAddress ?? ''],
  //     balances: [{ amount: 1n, badgeIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }] }]
  //   });
  //   await createBalancesMapAndAddToStorage(experiencesProtocolCollectionId, transfers, 'centralized', true);

  //   setLoading(false);
  // }

  return (
    <>
      {(collectionId || addressOrUsername) && (collectionId ? true : currAccount?.cosmosAddress && currAccount.cosmosAddress !== chain.cosmosAddress) && (<>
        <div className='flex flex-wrap'>
          <InformationDisplayCard 
            subtitle=''
            title='' inheritBg noBorder md={24} sm={24} xs={24} 
            style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}
          >
            <ReactStars
              count={5}
              value={stars}
              onChange={(newRating: number) => {
                setStars(newRating)
              }}
              size={24}
              color2="#ffd700"
            />
            <Input.TextArea
              className='primary-text inherit-bg'
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder={`Is this ${addressOrUsername ? 'user' : 'badge'} legit? What was your experience? Leave a review (Max 2048 Characters)`}
              style={{ marginBottom: 16 }}
            />
            <Tooltip color="black" title={!chain.loggedIn ? 'Must be connected and signed in.' : ''}>
              <div className='flex-center'>
                <Button
                  disabled={newReview.length > 2048 || !chain.loggedIn || loading || newReview.length === 0}
                  type="primary"
                  loading={loading}

                  className='full-width'
                  onClick={async () => {
                    if (newReview.length === 0) return;
                    setLoading(true);
                    if (collectionId) {
                      await addReviewForCollection(collectionId, { review: newReview, stars });
                      await fetchCollections([collectionId], true);
                    } else if (addressOrUsername) {
                      await addReviewForUser(addressOrUsername, { review: newReview, stars });
                      await fetchAccounts([addressOrUsername], true);
                      await fetchNextForAccountViews(addressOrUsername, 'latestReviews', 'latestReviews');
                    }
                    setNewReview('');
                    setLoading(false);
                  }}
                >
                  Submit Review
                </Button>
              </div>

            </Tooltip>
          </InformationDisplayCard>
            {/* <InformationDisplayCard title='Experiences Protocol'
            subtitle='Share your experience of this collection using the BitBadges experiences protocol.'
            inheritBg noBorder md={12} sm={24} xs={24}  style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
              <br/>
              <div className='flex-center flex-column'>
                {!chain.loggedIn ? <BlockinDisplay /> : (
                  <Tooltip title="Follow with the BitBadges Experiences Protocol" placement="bottom">
                    <Avatar
                      size="large"
                      onClick={async () => {
                        await addToExperiencesProtocol(1n);
                      }}
                      className="styled-button-normal account-socials-button"
                    >
                      {loading ? <Spin /> : <UserAddOutlined />}
                    </Avatar>
                  </Tooltip>
                )}
              </div>

              <div className='flex-center'>
                    Followers ({followDetails?.followersCount.toString()})
                  </div>
                  {followDetails && followDetails?.followers.length > 0 &&
                    <InfiniteScroll
                      dataLength={followDetails.followers.length}
                      next={async () => {
                        await fetchMore();
                      }}
                      hasMore={false}
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
            
          </InformationDisplayCard> */}
        </div>
        {/* <Divider />
        <div className='flex-center flex-wrap'>
          {[1n, 2n, 3n, 4n, 5n, 6n].map((badgeId) => {
            return <InformationDisplayCard 
              title={`Follow Badge #${badgeId.toString()}`}
              key={badgeId.toString()}
              md={8}
              sm={24}
              xs={24}
              style={{ marginBottom: 16 }}
              >
                <CollectionHeader collectionId={experiencesProtocolCollectionId} badgeId={badgeId} />
                
              </InformationDisplayCard>

          })}
        </div> */}
      
      </>)}
      {reviews.length === 0 && !hasMore && <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No reviews."
        className='primary-text'
      />}
      <InfiniteScroll
        dataLength={reviews.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<div>
          <br />
          <Spin size={'large'} />
          <br />
                    <br />
        </div>}
        scrollThreshold="200px"
        endMessage={null}
        style={{ width: '100%', overflow: 'hidden' }}
      >
        {reviews.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        ).map((review, index) => {
          // if (index < currPageStart || index > currPageEnd) return <></>;
          return (
            <div key={index} className='primary-text full-width'>
              <Row className='full-width' style={{ width: '100%', display: 'flex', alignItems: ' center' }}>
                <Col md={12} sm={24} xs={24} className='primary-text' style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'start' }} >
                    <AddressDisplay addressOrUsername={review.from} />
                  </div>
                  <div className='primary-text full-width flex-between'>
                    <div className='primary-text full-width flex-between'>
                      <Typography.Text className='primary-text' style={{ fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                        <ReactStars
                          edit={false}
                          count={5}
                          value={Numberify(review.stars)}
                          size={24}
                          color2="#ffd700"
                        />
                      </Typography.Text>
                    </div>
                  </div>

                  <Typography.Text strong className='primary-text' style={{ fontSize: 15, textAlign: 'left', marginRight: 8 }}>
                    {new Date(Number(review.timestamp.toString())).toLocaleDateString() + ' '}
                    {new Date(Number(review.timestamp.toString())).toLocaleTimeString()}
                  </Typography.Text>
                  {chain.connected && chain.loggedIn && (chain.address === review.from || chain.cosmosAddress === review.from) &&
                    <DeleteOutlined className='styled-button-normal' style={{ border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        if (loading) return;

                        setLoading(true);
                        await deleteReview(review._legacyId);
                        if (collectionId) {
                          await fetchCollections([collectionId], true);
                        } else if (addressOrUsername) {
                          await fetchAccounts([addressOrUsername], true);
                          await fetchNextForAccountViews(addressOrUsername, 'latestReviews', 'latestReviews');
                        }
                        setLoading(false);
                      }}
                    />
                  }
                  <br />
                  {review.review}
                </Col>
              </Row>


              <Divider />
            </div>
          )
        })}
      </InfiniteScroll >
    </>
  )
}
