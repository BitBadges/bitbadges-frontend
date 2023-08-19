import { Col, Divider, Empty, Modal, Row, Spin, Tooltip, Typography } from 'antd';
import { ClaimAlertInfo } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { BadgeAvatar } from '../badges/BadgeAvatar';

export function ClaimAlertsTab({ claimAlerts, fetchMore, hasMore }: {
  claimAlerts: ClaimAlertInfo<bigint>[],
  fetchMore: () => void,
  hasMore: boolean
}) {

  const collections = useCollectionsContext();


  const router = useRouter();


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    const collectionsToFetch = claimAlerts.map(a => a.collectionId);
    collections.fetchCollections(collectionsToFetch);

    if (INFINITE_LOOP_MODE) console.log('AnnouncementsTab useEffect', { collectionsToFetch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimAlerts]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (hasMore) fetchMore();
  }, [hasMore, fetchMore])

  return (
    <>

      {claimAlerts.length === 0 && !hasMore && <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No Alerts"
        className='primary-text'
      />}

      <InfiniteScroll
        dataLength={claimAlerts.length}
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
        {claimAlerts.sort(
          (a, b) => Number(b.createdTimestamp) - Number(a.createdTimestamp)
        ).map((claimAlert, index) => {
          // if (index < currPageStart || index > currPageEnd) return <></>;

          const collectionToDisplay = collections.collections[claimAlert.collectionId.toString()];
          return (
            <div key={index} className='primary-text full-width'>
              <Row style={{ width: '100%', display: 'flex', alignItems: ' center' }}>
                <Col md={12} sm={24} xs={24} className='primary-text' style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
                  {collectionToDisplay &&
                    <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'start' }} >
                      <BadgeAvatar
                        metadataOverride={collectionToDisplay.cachedCollectionMetadata}
                        collectionId={claimAlert.collectionId}
                        size={50}
                        noHover
                      />
                      <Tooltip color='black' title={"Collection ID: " + collectionToDisplay.collectionId} placement="bottom">
                        <div className='link-button-nav flex-center' onClick={() => {
                          router.push('/collections/' + collectionToDisplay.collectionId)
                          Modal.destroyAll()
                        }} style={{ fontSize: 20 }}>
                          <a>
                            {collectionToDisplay.cachedCollectionMetadata?.name}
                          </a>
                        </div>
                      </Tooltip>
                    </div>}


                  <Typography.Text strong className='primary-text' style={{ fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                    {new Date(Number(claimAlert.createdTimestamp)).toLocaleDateString() + ' '}
                    {new Date(Number(claimAlert.createdTimestamp)).toLocaleTimeString()}
                  </Typography.Text>

                </Col>
              </Row>

              <div className='flex-between full-width primary-text'>

                <div className='flex-between full-width primary-text'>
                  <Typography.Text className='primary-text' style={{ fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                    {claimAlert.message}
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
