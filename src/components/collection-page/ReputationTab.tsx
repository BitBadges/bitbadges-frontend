import { Button, Col, Divider, Empty, Input, Row, Spin, Tooltip, Typography } from 'antd';
import { BitBadgeCollection, ReviewActivityItem, SupportedChain } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactStars from "react-stars";
import { addReview, addReviewForUser } from '../../bitbadges-api/api';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';


export function ReputationTab(
  { reviews, collection, 
    cosmosAddress,
    // user, 
    fetchMore, hasMore }: {
      cosmosAddress?: string,
    reviews: ReviewActivityItem[];
    collection?: BitBadgeCollection,
    // user?: BitBadgesUserInfo,
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
        for (let i = 0; i <= reviews.length; i++) {
            const accountsToFetch: number[] = [];
           
            for (const review of reviews) {
                if (!accounts.cosmosAddressesByAccountNumbers[review.from]) {
                    accountsToFetch.push(review.from);
                }
            }

            if (accountsToFetch.length > 0) {
                accounts.fetchAccountsByNumber(accountsToFetch);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviews])

    return (
        <>
            {(collection || cosmosAddress) && (<>
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

                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder={`Is this ${cosmosAddress ? 'user': 'badge'} legit? What was your experience? Leave a review (Max 2048 Characters)`}
                    style={{ marginBottom: 16, backgroundColor: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                />
                <Tooltip color="black" title={!chain.loggedIn ? 'Must be connected and signed in.' : ''}>
                <Button
                    disabled={newReview.length > 2048 || !chain.loggedIn}
                    type="primary"
                    loading={loading}
                    style={{ width: '100%' }}
                    onClick={async () => {
                        if (newReview.length === 0) return;
                        setLoading(true);
                        if (collection) {
                          await addReview(newReview, stars, collection.collectionId);
                          await collections.refreshCollection(collection.collectionId);
                        } else if (cosmosAddress) {
                          await addReviewForUser(newReview, stars, cosmosAddress);
                          await accounts.fetchAccounts([cosmosAddress], true);
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
            {reviews.length === 0 && <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No reviews."
                style={{ color: PRIMARY_TEXT }}
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
                endMessage={
                    <></>
                }
                style={{ width: '100%', overflow: 'hidden' }}
            >
                {reviews.map((review, index) => {
                    // if (index < currPageStart || index > currPageEnd) return <></>;
                    return (
                        <div key={index} style={{ color: PRIMARY_TEXT, width: '100%', }}>

                            <Row style={{ width: '100%', display: 'flex', alignItems: ' center' }}>
                                <Col md={12} sm={24} xs={24} style={{ color: PRIMARY_TEXT, alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>


                                    <div style={{ display: 'flex', alignItems: 'center' }} >
                                        <AddressDisplay userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[review.from]] || {
                                            address: '',
                                            cosmosAddress: '',
                                            accountNumber: review.from,
                                            chain: SupportedChain.UNKNOWN
                                        }}
                                            darkMode
                                        />
                                    </div>


                                    <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                                        {new Date(review.timestamp).toLocaleDateString() + ' '}
                                        {new Date(review.timestamp).toLocaleTimeString()}
                                    </Typography.Text>
                                </Col>
                            </Row>

                            <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>

                                <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                    <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                                        <ReactStars
                                        edit={false}
                  count={5}
                  value={review.stars}
                  size={24}
                  color2="#ffd700"
                /> {review.review}
                                    </Typography.Text>
                                </div>


                            </div>
                            <Divider />
                        </div>
                        
                    )
                })}
            </InfiniteScroll >
        </>
    )
}
