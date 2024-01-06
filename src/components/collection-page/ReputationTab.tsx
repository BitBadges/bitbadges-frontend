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
  const currAccount = useAccount(addressOrUsername ? addressOrUsername : collection?.aliasAddress);

  const [newReview, setNewReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(5);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch accounts');
    const accountsToFetch: string[] = reviews.map(r => r.from);
    fetchAccounts(accountsToFetch);
  }, [reviews]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch more');
    if (hasMore) fetchMore();
  }, [fetchMore, hasMore])

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
        </div>
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
