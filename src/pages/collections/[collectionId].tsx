import { ClockCircleOutlined } from '@ant-design/icons';
import { Divider, Empty, Layout, Typography, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { MSG_PREVIEW_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { UserApprovalsTab } from '../../components/collection-page/ApprovalsTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { ClaimsTab } from '../../components/collection-page/ClaimsTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { TransferabilityTab } from '../../components/collection-page/TransferabilityTab';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE, NODE_URL } from '../../constants';

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
  const collection = collections.getCollection(collectionIdNumber)
  const badgeIdNumber = badgeId && typeof badgeId === 'string' ? BigInt(badgeId) : -1;

  const [tab, setTab] = useState(badgeIdNumber > 0 ? 'badges' : (password || code || claimsTab) ? 'claims' : 'overview');

  const collectionMetadata = collection?.cachedCollectionMetadata;

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const tabInfo = [];
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },

      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'claims', content: 'Mints', disabled: false },
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
      { key: 'announcements', content: 'Announcements', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
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
        accounts.fetchAccounts([...new Set([currCollection.createdBy, ...managers])])

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
          marginLeft: !isPreview ? '7vw' : undefined,
          marginRight: !isPreview ? '7vw' : undefined,
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
                await collections.fetchNextForViews(collectionIdNumber, ['latestReviews']);
              }}
              hasMore={collections.getCollection(collectionIdNumber)?.views.latestReviews?.pagination.hasMore ?? true}
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
              activity={collections.getActivityView(collectionIdNumber, 'latestActivity') ?? []}
              fetchMore={async () => {
                await collections.fetchNextForViews(collectionIdNumber, ['latestActivity']);
              }}
              hasMore={collections.getCollection(collectionIdNumber)?.views.latestActivity?.pagination.hasMore ?? true}
            />
          )}

          {tab === 'announcements' && !isPreview && collection && (
            <>
              <AnnouncementsTab announcements={collections.getAnnouncementsView(collectionIdNumber, 'latestAnnouncements') ?? []}
                collectionId={collectionIdNumber}
                fetchMore={async () => {
                  await collections.fetchNextForViews(collectionIdNumber, ['latestAnnouncements']);
                }}
                hasMore={collections.getCollection(collectionIdNumber)?.views.latestAnnouncements?.pagination.hasMore ?? true}
              />
            </>
          )}

          {tab === 'history' && !isPreview && <div className='primary-text'>
            <br />
            {collection.updateHistory.sort((a, b) => b.block - a.block > 0 ? -1 : 1).map((update, i) => {
              return <div key={i} style={{ textAlign: 'left' }} className='primary-text'>

                <Typography.Text strong className='primary-text' style={{ fontSize: '1.2em' }}>
                  <ClockCircleOutlined style={{ marginRight: '5px' }} />
                  {i == 0 ? 'Created' : 'Updated'
                  } at{' '}
                  {new Date(Number(update.blockTimestamp)).toLocaleString()}
                  {' '}(Block #{update.block.toString()})

                </Typography.Text>
                <p>Transaction Hash: <a href={NODE_URL + '/cosmos/tx/v1beta1/txs/' + update.txHash} target='_blank' rel='noopener noreferrer'>
                  {update.txHash}
                </a></p>
                <Divider />
              </div>
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
