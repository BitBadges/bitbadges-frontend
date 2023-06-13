import { Divider, Empty, Layout, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { ClaimsTab } from '../../components/collection-page/ClaimsTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { Tabs } from '../../components/navigation/Tabs';
import { MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';

const { Content } = Layout;

function CollectionPage({
  collectionPreview, //Only used for previews on TxTimeline
}: {
  collectionPreview: boolean
}) {
  const router = useRouter()
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);
  const { collectionId, badgeId, password, code, claimsTab } = router.query;
  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId && !isPreview && typeof collectionId === 'string' ? BigInt(collectionId) : isPreview ? MSG_PREVIEW_ID : -1n;
  const collection = collections.getCollection(collectionIdNumber);
  const badgeIdNumber = badgeId && typeof badgeId === 'string' ? BigInt(badgeId) : -1;

  const [tab, setTab] = useState(badgeIdNumber ? 'badges' : (password || code || claimsTab) ? 'claims' : 'overview');

  const collectionMetadata = collection?.collectionMetadata;

  const isOffChainBalances = collection && collection.balancesUri ? true : false;

  const tabInfo = [];
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'claims', content: 'Claims', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  } else {
    // EXPERIMENTAL STANDARD
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  }

  //Get collection information
  useEffect(() => {
    async function fetchCollections() {
      if (collectionIdNumber > 0) {
        const collections = await collectionsRef.current.fetchCollections([collectionIdNumber]);
        const currCollection = collections[0];

        if (currCollection.collectionMetadata?._isUpdating || currCollection.badgeMetadata.find(badge => badge.metadata._isUpdating)) {
          notification.warn({
            message: 'Metadata for this collection is currently being fetched.',
            description: 'Certain metadata may not be up to date until the fetch is complete.',
          });
        }
      }
    }
    if (isPreview) return;
    fetchCollections();
  }, [collectionIdNumber, isPreview])

  //Set tab to badges if badgeId is in query
  useEffect(() => {
    if (badgeId) setTab('badges');
  }, [badgeId])

  //Set tab to badges if badgeId is in query
  useEffect(() => {
    if (code || password || claimsTab) setTab('claims');
  }, [code, password, claimsTab])

  // Get user's badge balance
  useEffect(() => {
    if (isPreview) return;
    async function getBadgeBalanceByAddressFromApi() {
      if (isPreview) return;
      await collectionsRef.current.fetchBalanceForUser(collectionIdNumber, chain.cosmosAddress);
    }
    getBadgeBalanceByAddressFromApi();
  }, [collectionIdNumber, chain.cosmosAddress, isPreview]);

  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          className='primary-blue-bg'
          style={{
            marginLeft: !isPreview ? '7vw' : undefined,
            marginRight: !isPreview ? '7vw' : undefined,
            paddingLeft: !isPreview ? '1vw' : undefined,
            paddingRight: !isPreview ? '1vw' : undefined,
            paddingTop: '20px',
          }}
        >
          {collection && <>
            <BadgeButtonDisplay website={collectionMetadata?.externalUrl} />
            {/* Overview and Tabs */}
            {collectionMetadata && <CollectionHeader collectionId={collectionIdNumber} />}
            <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
            <br />

            {/* Tab Content */}
            {tab === 'overview' && (
              <OverviewTab
                setTab={setTab}
                collectionId={collectionIdNumber}

              />
            )}
            {tab === 'badges' && (
              <BadgesTab collectionId={collectionIdNumber} />
            )}


            {isPreview && (tab === 'claims' || tab === 'actions' || tab === 'activity' || tab === 'announcements' || tab === 'reputation') && <Empty
              className='primary-text'
              description={
                "This tab is not supported for previews."
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />}

            {tab === 'reputation' && !isPreview && (
              <ReputationTab
                reviews={collection.reviews}
                collectionId={collectionIdNumber}
                fetchMore={async () => {
                  await collections.fetchNextForViews(collectionIdNumber, ['latestReviews']);
                }}
                hasMore={collections.getCollection(collectionIdNumber)?.views.latestReviews?.pagination.hasMore || false}
              />
            )}

            {tab === 'claims' && !isPreview && (
              <ClaimsTab
                collectionId={collectionIdNumber}

              />
            )}

            {tab === 'actions' && !isPreview && (
              <ActionsTab
                collectionId={collectionIdNumber}
              />
            )}

            {tab === 'activity' && !isPreview && collection && (
              <ActivityTab
                activity={collection.activity}
                fetchMore={async () => {
                  await collections.fetchNextForViews(collectionIdNumber, ['latestActivity']);
                }}
                hasMore={collections.getCollection(collectionIdNumber)?.views.latestActivity?.pagination.hasMore || false}
              />
            )}

            {tab === 'announcements' && !isPreview && collection && (
              <>
                <AnnouncementsTab announcements={collection.announcements} collectionId={collectionIdNumber}
                  fetchMore={async () => {
                    await collections.fetchNextForViews(collectionIdNumber, ['latestAnnouncements']);
                  }}
                  hasMore={collections.getCollection(collectionIdNumber)?.views.latestAnnouncements?.pagination.hasMore || false}
                />
              </>
            )}
          </>
          }
        </div>
        <Divider />
      </Content>
    </Layout>
  );
}

export default CollectionPage;
