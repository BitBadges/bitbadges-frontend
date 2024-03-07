import { Col, Empty, Modal, Spin, Tooltip, Typography } from 'antd';
import { ClaimAlertDoc } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import { BellFilled } from '@ant-design/icons';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { BadgeAvatar } from '../badges/BadgeAvatar';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function ClaimAlertsTab({
  claimAlerts,
  fetchMore,
  hasMore,
  showToAddress,
  unseenCount
}: {
  claimAlerts: Array<ClaimAlertDoc<bigint>>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
  showToAddress?: boolean;
  unseenCount?: number;
}) {
  useEffect(() => {
    const collectionsToFetch = claimAlerts.map((a) => a.collectionId);
    fetchCollections(collectionsToFetch);

    if (INFINITE_LOOP_MODE) console.log('AnnouncementsTab useEffect', { collectionsToFetch });
  }, [claimAlerts]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (hasMore) fetchMore();
  }, [hasMore, fetchMore]);

  return (
    <>
      {claimAlerts.length === 0 && !hasMore && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Alerts" className="primary-text" />}

      <InfiniteScroll
        dataLength={claimAlerts.length}
        next={fetchMore}
        hasMore={hasMore}
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
        style={{ width: '100%', overflow: 'hidden' }}>
        {claimAlerts.map((claimAlert, index) => {
          return (
            <ClaimAlertDisplay key={index} claimAlert={claimAlert} showToAddress={showToAddress} unseen={!!unseenCount && index < unseenCount} />
          );
        })}
      </InfiniteScroll>
    </>
  );
}

export function ClaimAlertDisplay({
  claimAlert,
  showToAddress,
  unseen
}: {
  claimAlert: ClaimAlertDoc<bigint>;
  showToAddress?: boolean;
  unseen?: boolean;
}) {
  const router = useRouter();
  const collectionToDisplay = useCollection(claimAlert.collectionId);
  return (
    <div className="primary-text full-width">
      <InformationDisplayCard style={{ width: '100%' }}>
        <Col md={24} sm={24} xs={24} className="primary-text" style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
          {collectionToDisplay && (
            <div className="flex-center" style={{ alignItems: 'center', justifyContent: 'start' }}>
              <BadgeAvatar metadataOverride={collectionToDisplay.cachedCollectionMetadata} collectionId={claimAlert.collectionId} size={50} noHover />
              {unseen && (
                <b>
                  <BellFilled size={20} className="mr-2" style={{ fontSize: 20, color: 'red' }} />
                </b>
              )}
              <Tooltip color="black" title={'Collection ID: ' + collectionToDisplay.collectionId} placement="bottom">
                <div
                  className="link-button-nav flex-center"
                  onClick={() => {
                    router.push('/collections/' + collectionToDisplay.collectionId);
                    Modal.destroyAll();
                  }}
                  style={{ fontSize: 20 }}>
                  <a>{collectionToDisplay.cachedCollectionMetadata?.name}</a>
                </div>
              </Tooltip>
            </div>
          )}
          {showToAddress && <AddressDisplayList center={false} users={claimAlert.cosmosAddresses} />}

          <Typography.Text strong className="secondary-text" style={{ fontSize: 18, textAlign: 'left', margin: 4 }}>
            {new Date(Number(claimAlert.timestamp)).toLocaleDateString() + ' '}
            {new Date(Number(claimAlert.timestamp)).toLocaleTimeString()}
          </Typography.Text>

          <div className="flex-between full-width primary-text">
            <div className="flex-between full-width primary-text">
              <Typography.Text className="secondary-text" style={{ fontSize: 16, textAlign: 'left', margin: 4 }}>
                {/* replace all links with <a> */}
                {claimAlert.message?.split(' ').map((word, index) => {
                  const isUri = word.includes('://');
                  let abbreviatedUri = word.slice(0, 50);
                  if (abbreviatedUri.length < word.length) abbreviatedUri += '.....';
                  //append last 5 chars if there
                  if (abbreviatedUri.length < word.length) abbreviatedUri += word.slice(word.length - 5, word.length);

                  if (isUri) {
                    return (
                      <Tooltip title={word} placement="bottom" key={index}>
                        <a href={word} target="_blank" rel="noopener noreferrer">
                          {abbreviatedUri}
                        </a>
                      </Tooltip>
                    );
                  } else {
                    return word + ' ';
                  }
                })}
              </Typography.Text>
            </div>
          </div>
        </Col>
      </InformationDisplayCard>
    </div>
  );
}
