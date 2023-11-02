import { Divider, Empty, Layout, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchCollections, fetchNextForCollectionViews, useCollection, getCollectionActivityView, getCollectionAnnouncementsView, getCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { UserApprovalsTab } from '../../components/collection-page/ApprovalsTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { OffChainTransferabilityTab } from '../../components/collection-page/OffChainTransferabilityTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { TransferabilityTab } from '../../components/collection-page/TransferabilityTab';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

function CollectionPage({
  collectionPreview, //Only used for previews on TxTimeline
}: {
  collectionPreview: boolean
}) {
  const router = useRouter()
  const { collectionId, password, code, claimsTab } = router.query;
  const isPreview = collectionPreview ? true : false;
  const collectionIdNumber = collectionId && !isPreview && typeof collectionId === 'string' ? BigInt(collectionId) : isPreview ? NEW_COLLECTION_ID : -1n;
  const collection = useCollection(collectionIdNumber);

  const [tab, setTab] = useState((password || code || claimsTab) ? 'claims' : 'overview');
  const [warned, setWarned] = useState(false);

  const collectionMetadata = collection?.cachedCollectionMetadata;
  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const tabInfo = [];
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'approvals', content: 'Approvals', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'history', content: 'Update History', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  } else {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'history', content: 'Update History', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  }

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch collection ,collection page');
    async function fetchCollectionsFunc() {
      if (collectionIdNumber > 0) {
        await fetchCollections([collectionIdNumber]);
        //IMPORTANT: Note that collectionsRes is the fetched collection which may be paginated, incomplete, etc
      }
    }
    if (isPreview) return;
    fetchCollectionsFunc();
  }, [collectionIdNumber, isPreview])

  useEffect(() => {


    // if (currCollection.cachedCollectionMetadata?._isUpdating || currCollection.cachedBadgeMetadata.find(badge => badge.metadata._isUpdating)) {
    if (!warned && !isPreview) {
      notification.warn({
        message: collection?.balancesType === "Off-Chain" ? `Metadata for this collection is currently being refreshed.` : `Metadata and balances for this collection are currently being refreshed.`,
        description: 'Certain metadata may be empty or not up to date until the sync is complete.',
      });

      setWarned(true);
    }
  }, [collection, warned, isPreview])

  //Set tab to badges if badgeId is in query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set tab to claims');
    if (code || password || claimsTab) setTab('transferability');
  }, [code, password, claimsTab])

  return (
    <Content
      style={{
        textAlign: 'center',
        minHeight: '100vh',
      }}
    >
      <br />
      <div
        title=''
        style={{
          marginLeft: !isPreview ? '3vw' : undefined,
          marginRight: !isPreview ? '3vw' : undefined,
          paddingLeft: !isPreview ? '1vw' : undefined,
          paddingRight: !isPreview ? '1vw' : undefined,
          paddingTop: '20px',
        }}
      >
        {collection && <>
          {!collectionPreview && <BadgeButtonDisplay website={collectionMetadata?.externalUrl} />}

          {/* Overview and Tabs */}
          {collectionMetadata && <CollectionHeader collectionId={collectionIdNumber} hideCollectionLink />}
          <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
          <br />

          {/* Tab Content */}
          {tab === 'overview' && (
            <OverviewTab collectionId={collectionIdNumber} />
          )}
          {tab === 'badges' && (
            <BadgesTab collectionId={collectionIdNumber} />
          )}
          {tab === 'transferability' && !isOffChainBalances && (
            <TransferabilityTab collectionId={collectionIdNumber} />
          )}
          {tab === 'transferability' && isOffChainBalances && (
            <OffChainTransferabilityTab collectionId={collectionIdNumber} />
          )}


          {isPreview && (tab === 'claims' || tab == 'history' || tab === 'actions' || tab === 'activity' || tab === 'announcements' || tab === 'reputation' || tab == 'approvals') && <Empty
            className='primary-text'
            description={
              "This tab is not supported for previews."
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />}

          {tab === 'approvals' && !isPreview && (
            <UserApprovalsTab collectionId={collectionIdNumber} />
          )}

          {tab === 'reputation' && !isPreview && (
            <ReputationTab
              reviews={collection.reviews}
              collectionId={collectionIdNumber}
              fetchMore={async () => {
                await fetchNextForCollectionViews(collectionIdNumber, ['latestReviews']);
              }}
              hasMore={getCollection(collectionIdNumber)?.views.latestReviews?.pagination.hasMore ?? true}
            />
          )}

          {tab === 'actions' && !isPreview && (
            <ActionsTab
              collectionId={collectionIdNumber}
            />
          )}

          {tab === 'activity' && !isPreview && collection && (
            <ActivityTab
              activity={getCollectionActivityView(collection, 'latestActivity') ?? []}
              fetchMore={async () => {
                await fetchNextForCollectionViews(collectionIdNumber, ['latestActivity']);
              }}
              hasMore={getCollection(collectionIdNumber)?.views.latestActivity?.pagination.hasMore ?? true}
            />
          )}

          {tab === 'announcements' && !isPreview && collection && (
            <>
              <AnnouncementsTab announcements={getCollectionAnnouncementsView(collection, 'latestAnnouncements') ?? []}
                collectionId={collectionIdNumber}
                fetchMore={async () => {
                  await fetchNextForCollectionViews(collectionIdNumber, ['latestAnnouncements']);
                }}
                hasMore={getCollection(collectionIdNumber)?.views.latestAnnouncements?.pagination.hasMore ?? true}
              />
            </>
          )}

          {tab === 'history' && !isPreview && <div className='primary-text'>
            <br />
            {collection.updateHistory.map((update, i) => {
              return <TxHistory key={i} tx={update} creationTx={i == 0} />
            })}
          </div>}
        </>
        }
      </div>
      <Divider />
    </Content>
  );
}

export default CollectionPage;
