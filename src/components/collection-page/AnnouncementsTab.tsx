import { Button, Col, Divider, Empty, Input, Modal, Row, Spin, Tooltip, Typography } from 'antd';
import { AnnouncementActivityItem, BitBadgeCollection } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { addAnnouncement } from '../../bitbadges-api/api';
import { BLANK_USER_INFO, INFINITE_LOOP_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';

export function AnnouncementsTab({ announcements, collection, hideCollection, fetchMore, hasMore }: {
  announcements: AnnouncementActivityItem[];
  collection?: BitBadgeCollection,
  hideCollection?: boolean,
  fetchMore: () => void,
  hasMore: boolean
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const router = useRouter();

  const [newAnnouncement, setNewAnnouncement] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const accountsToFetch: number[] = announcements.map(a => a.from);
    const collectionsToFetch: number[] = announcements.map(a => a.collectionId);
    accounts.fetchAccountsByNumber(accountsToFetch);
    collections.fetchCollections(collectionsToFetch);

    if (INFINITE_LOOP_MODE) console.log('AnnouncementsTab useEffect', { accountsToFetch, collectionsToFetch });
  }, [announcements, accounts, collections]);

  return (
    <>
      {collection && chain.accountNumber === collection.manager.accountNumber && chain.loggedIn && (<>
        <br />
        <Input.TextArea
          value={newAnnouncement}
          onChange={(e) => setNewAnnouncement(e.target.value)}
          placeholder="New Announcement (Max 2048 Characters)"
          style={{ marginBottom: 16, backgroundColor: PRIMARY_BLUE, color: PRIMARY_TEXT }}
        />

        <Button
          disabled={newAnnouncement.length > 2048}
          type="primary"
          loading={loading}
          style={{ width: '100%' }}
          onClick={async () => {
            if (newAnnouncement.length === 0) return;
            setLoading(true);
            await addAnnouncement(newAnnouncement, collection.collectionId);
            await collections.refreshCollection(collection.collectionId);
            setNewAnnouncement('');
            setLoading(false);
          }}
        >
          Send Announcement to All Owners
        </Button>
        <Divider />
      </>)}
      {announcements.length === 0 && <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No Announcements"
        style={{ color: PRIMARY_TEXT }}
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
        endMessage={
          <></>
        }
        style={{ width: '100%', overflow: 'hidden' }}
      >
        {announcements.map((announcement, index) => {
          // if (index < currPageStart || index > currPageEnd) return <></>;

          const collectionToDisplay = collections.collections[announcement.collectionId]?.collection;
          return (
            <div key={index} style={{ color: PRIMARY_TEXT, width: '100%', }}>

              <Row style={{ width: '100%', display: 'flex', alignItems: ' center' }}>
                <Col md={12} sm={24} xs={24} style={{ color: PRIMARY_TEXT, alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }} >
                    <AddressDisplay userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[announcement.from]] || BLANK_USER_INFO}
                      darkMode
                    />
                  </div>
                  {!hideCollection && collectionToDisplay &&
                    <div style={{ display: 'flex', alignItems: 'center' }} >

                      <Tooltip color='black' title={"Collection ID: " + collectionToDisplay.collectionId} placement="bottom">
                        <div className='link-button-nav' onClick={() => {
                          router.push('/collections/' + collectionToDisplay.collectionId)
                          Modal.destroyAll()
                        }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          <a>
                            {collectionToDisplay.collectionMetadata?.name}
                          </a>

                        </div>
                      </Tooltip>
                    </div>}


                  <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                    {new Date(announcement.timestamp).toLocaleDateString() + ' '}
                    {new Date(announcement.timestamp).toLocaleTimeString()}
                  </Typography.Text>
                </Col>
              </Row>
              <Divider />

              <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>

                <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                    {announcement.announcement}
                  </Typography.Text>
                </div>
              </div>
            </div>
          )
        })}
      </InfiniteScroll >
    </>
  )
}
