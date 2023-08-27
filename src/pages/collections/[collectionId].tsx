import { Divider, Empty, Layout, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { ActivityTab } from '../../components/activity/TransferActivityDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { UserApprovalsTab } from '../../components/collection-page/ApprovalsTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { ClaimsTab } from '../../components/collection-page/ClaimsTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { TransferabilityTab } from '../../components/collection-page/TransferabilityTab';
import { Tabs } from '../../components/navigation/Tabs';
import { MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';
import { INFINITE_LOOP_MODE } from '../../constants';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';

const { Content } = Layout;

function CollectionPage({
  collectionPreview, //Only used for previews on TxTimeline
}: {
  collectionPreview: boolean
}) {
  const router = useRouter()
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();

  const { collectionId, badgeId, password, code, claimsTab } = router.query;
  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId && !isPreview && typeof collectionId === 'string' ? BigInt(collectionId) : isPreview ? MSG_PREVIEW_ID : -1n;
  const collection = collections.collections[collectionIdNumber.toString()]
  const badgeIdNumber = badgeId && typeof badgeId === 'string' ? BigInt(badgeId) : -1;

  const [tab, setTab] = useState(badgeIdNumber > 0 ? 'badges' : (password || code || claimsTab) ? 'claims' : 'overview');

  const collectionMetadata = collection?.cachedCollectionMetadata;

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const tabInfo = [];
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'approvals', content: 'Approvals', disabled: false },
      { key: 'claims', content: 'Claims', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  } else {
    // EXPERIMENTAL STANDARD
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      // { key: 'activity', content: 'Activity', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  }

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch collection ,collection page');
    async function fetchCollections() {
      if (collectionIdNumber > 0) {
        const collectionsRes = await collections.fetchCollections([collectionIdNumber]);
        const currCollection = collectionsRes[0];

        const managers = currCollection.managerTimeline.map(x => x.manager).filter(x => x);
        accounts.fetchAccounts([currCollection.createdBy, ...managers]);

        if (currCollection.cachedCollectionMetadata?._isUpdating || currCollection.cachedBadgeMetadata.find(badge => badge.metadata._isUpdating)) {
          notification.warn({
            message: collection?.balancesType === "Off-Chain" ? `Metadata for this collection is currently being refreshed.` : `Metadata and balances for this collection are currently being refreshed.`,
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
    if (INFINITE_LOOP_MODE) console.log('useEffect: set tab to badges ');
    if (badgeId) setTab('badges');
  }, [badgeId])

  //Set tab to badges if badgeId is in query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set tab to claims');
    if (code || password || claimsTab) setTab('claims');
  }, [code, password, claimsTab])

  // Get user's badge balance
  // useEffect(() => {
  //   if (INFINITE_LOOP_MODE) console.log('useEffect: get badge balance by address from api ');
  //   if (isPreview) return;
  //   async function getBadgeBalanceByAddressFromApi() {
  //     if (isPreview) return;
  //     if (collectionIdNumber > 0 && chain.address) {
  //       await collections.fetchBalanceForUser(collectionIdNumber, chain.address);
  //     }
  //   }
  //   getBadgeBalanceByAddressFromApi();
  // }, [collectionIdNumber, chain.address, isPreview]);

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
            {collectionMetadata && <CollectionHeader collectionId={collectionIdNumber} hideCollectionLink />}
            <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
            <br />

            {/* Tab Content */}
            {tab === 'overview' && (
              <OverviewTab
                collectionId={collectionIdNumber}
              />
            )}
            {tab === 'badges' && (
              <BadgesTab collectionId={collectionIdNumber} />
            )}
            {tab === 'transferability' && (
              <TransferabilityTab collectionId={collectionIdNumber} setTab={setTab} />
            )}

            {tab === 'approvals' && (
              <UserApprovalsTab collectionId={collectionIdNumber} />
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
                hasMore={collections.collections[collectionIdNumber.toString()]?.views.latestReviews?.pagination.hasMore ?? true}
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
                hasMore={collections.collections[collectionIdNumber.toString()]?.views.latestActivity?.pagination.hasMore ?? true}
              />
            )}

            {tab === 'announcements' && !isPreview && collection && (
              <>
                <AnnouncementsTab announcements={collection.announcements} collectionId={collectionIdNumber}
                  fetchMore={async () => {
                    await collections.fetchNextForViews(collectionIdNumber, ['latestAnnouncements']);
                  }}
                  hasMore={collections.collections[collectionIdNumber.toString()]?.views.latestAnnouncements?.pagination.hasMore ?? true}
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
