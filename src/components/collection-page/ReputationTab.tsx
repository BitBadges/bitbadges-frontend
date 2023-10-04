import { Button, Col, Divider, Empty, Input, Row, Spin, Tooltip, Typography } from 'antd';
import { Numberify, ReviewInfo } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactStars from "react-stars";
import { addReviewForCollection, addReviewForUser, deleteReview } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';

import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { DeleteOutlined } from '@ant-design/icons';


export function ReputationTab({ reviews, collectionId, addressOrUsername, fetchMore, hasMore }:
  {
    addressOrUsername?: string,
    reviews: ReviewInfo<bigint>[];
    collectionId?: bigint,
    fetchMore: () => void,
    hasMore: boolean
  }
) {
  const chain = useChainContext();
  const accounts = useAccountsContext();

  const collections = useCollectionsContext();
  const [newReview, setNewReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(5);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch accounts');
    const accountsToFetch: string[] = reviews.map(r => r.from);
    accounts.fetchAccounts(accountsToFetch);
  }, [reviews]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: reputation fetch more');
    if (hasMore) fetchMore();
  }, [])


  return (
    <>
      {(collectionId || addressOrUsername) && (<>
        <br />
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
          <Button
            disabled={newReview.length > 2048 || !chain.loggedIn || loading}
            type="primary"
            loading={loading}
            className='full-width'
            onClick={async () => {
              if (newReview.length === 0) return;
              setLoading(true);
              if (collectionId) {
                await addReviewForCollection(collectionId, { review: newReview, stars });
                await collections.fetchCollections([collectionId], true);
              } else if (addressOrUsername) {
                await addReviewForUser(addressOrUsername, { review: newReview, stars });
                await accounts.fetchAccounts([addressOrUsername], true);
                await accounts.fetchNextForViews(addressOrUsername, ['latestReviews']);
              }
              setNewReview('');
              setLoading(false);
            }}
          >
            Submit Review
          </Button>
        </Tooltip>
        <Divider />
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
                    <DeleteOutlined className='styled-button' style={{ border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        if (loading) return;

                        setLoading(true);
                        await deleteReview(review._id);
                        if (collectionId) {
                          await collections.fetchCollections([collectionId], true);
                        } else if (addressOrUsername) {
                          await accounts.fetchAccounts([addressOrUsername], true);
                          await accounts.fetchNextForViews(addressOrUsername, ['latestReviews']);
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
