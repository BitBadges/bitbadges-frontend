import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Empty, Input, Modal, Row, Spin, Tooltip, Typography } from 'antd';
import { AnnouncementInfo, getCurrentValueForTimeline } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { addAnnouncement, deleteAnnouncement } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';

export function AnnouncementsTab({ announcements, collectionId, hideCollection, fetchMore, hasMore }: {
  announcements: AnnouncementInfo<bigint>[],
  collectionId?: bigint,
  hideCollection?: boolean,
  fetchMore: () => void,
  hasMore: boolean
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();

  const collections = useCollectionsContext();

  const collection = collectionId ? collections.collections[collectionId.toString()] : undefined;

  const router = useRouter();

  const [newAnnouncement, setNewAnnouncement] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    const accountsToFetch = announcements.map(a => a.from);
    const collectionsToFetch = announcements.map(a => a.collectionId);
    accounts.fetchAccounts(accountsToFetch);
    collections.fetchCollections(collectionsToFetch);

    if (INFINITE_LOOP_MODE) console.log('AnnouncementsTab useEffect', { accountsToFetch, collectionsToFetch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (hasMore) fetchMore();
  }, [hasMore, fetchMore])

  const manager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager;

  const isManager = manager && collection && collectionId && chain.cosmosAddress === manager && chain.loggedIn

  return (
    <>
      {isManager && (<>
        <br />
        <Input.TextArea
          value={newAnnouncement}
          onChange={(e) => setNewAnnouncement(e.target.value)}
          placeholder="New Announcement (Max 2048 Characters)"
          style={{ marginBottom: 16, }}
          className='primary-text primary-blue-bg'
        />

        <Button
          disabled={newAnnouncement.length > 2048}
          type="primary"
          loading={loading}
          className='full-width'
          onClick={async () => {
            if (newAnnouncement.length === 0) return;
            setLoading(true);
            await addAnnouncement(collectionId, { announcement: newAnnouncement });
            await collections.fetchCollections([collectionId], true);
            setNewAnnouncement('');
            setLoading(false);
          }}
        >
          Send Announcement to All Owners
        </Button>
        <Divider />
      </>)}
      {announcements.length === 0 && !hasMore && <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No Announcements"
        className='primary-text'
      />}

      <InfiniteScroll
        dataLength={announcements.length}
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
        {announcements.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        ).map((announcement, index) => {
          // if (index < currPageStart || index > currPageEnd) return <></>;

          const collectionToDisplay = collections.collections[announcement.collectionId.toString()];
          return (
            <div key={index} className='primary-text full-width'>
              <Row style={{ width: '100%', display: 'flex', alignItems: ' center' }}>
                <Col md={12} sm={24} xs={24} className='primary-text' style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
                  <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'start' }} >
                    <AddressDisplay addressOrUsername={announcement.from} />
                  </div>
                  {!hideCollection && collectionToDisplay &&
                    <div className='flex-center' style={{ alignItems: 'center', justifyContent: 'start' }} >

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
                    {new Date(Number(announcement.timestamp)).toLocaleDateString() + ' '}
                    {new Date(Number(announcement.timestamp)).toLocaleTimeString()}
                  </Typography.Text>
                  {chain.connected && chain.loggedIn && (chain.address === announcement.from || chain.cosmosAddress === announcement.from) &&
                    <DeleteOutlined className='styled-button' style={{ border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        if (loading) return;

                        setLoading(true);
                        await deleteAnnouncement(announcement._id);
                        if (collectionId) {
                          await collections.fetchCollections([collectionId], true);
                        }
                        setLoading(false);
                      }}
                    />
                  }
                </Col>
              </Row>

              <div className='flex-between full-width primary-text'>

                <div className='flex-between full-width primary-text'>
                  <Typography.Text className='primary-text' style={{ fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                    {announcement.announcement}
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
