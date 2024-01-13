import { Divider, Empty, Layout } from 'antd';
import { getCurrentValuesForCollection } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchCollections, fetchNextForCollectionViews, getCollectionActivityView, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { CollectionOwnersTab } from '../../components/collection-page/OwnersTab';
import { ReputationTab } from '../../components/collection-page/ReputationTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { UserApprovalsTab } from '../../components/collection-page/transferability/ApprovalsTab';
import { OffChainTransferabilityTab } from '../../components/collection-page/transferability/OffChainTransferabilityTab';
import { TransferabilityTab } from '../../components/collection-page/transferability/TransferabilityTab';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';
import { ReportedWrapper } from '../../components/wrappers/ReportedWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

function CollectionPage({
  collectionPreview, //Only used for previews on TxTimeline
}: {
  collectionPreview: boolean
}) {
  const router = useRouter()
  const { collectionId, password, code } = router.query;
  const isPreview = collectionPreview ? true : false;
  const collectionIdNumber = collectionId && !isPreview && typeof collectionId === 'string' ? BigInt(collectionId) : isPreview ? NEW_COLLECTION_ID : -1n;
  const collection = useCollection(collectionIdNumber);

  const [tab, setTab] = useState((password || code) ? 'transferability' : 'overview');
  const [warned, setWarned] = useState(false);

  const collectionMetadata = collection?.cachedCollectionMetadata;
  const isOffChainBalances = collection && collection.balancesType == "Off-Chain - Indexed" ? true : false;
  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No User Ownership");
  const isNonIndexedBalances = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;

  let tabInfo = [];
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },
      { key: 'owners', content: 'Owners', disabled: false },
      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'approvals', content: 'Approvals', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'history', content: 'Update History', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  } else {
    tabInfo.push(
      { key: 'overview', content: 'Overview', disabled: false },
      { key: 'badges', content: 'Badges', disabled: false },

      { key: 'owners', content: 'Owners', disabled: false },
      { key: 'transferability', content: 'Transferability', disabled: false },
      { key: 'reputation', content: 'Reviews', disabled: false },
      { key: 'activity', content: 'Activity', disabled: false },
      { key: 'history', content: 'Update History', disabled: false },
      { key: 'actions', content: 'Actions', disabled: false },
    )
  }

  if (noBalancesStandard) {
    tabInfo = tabInfo.filter(tab => tab.key !== 'transferability' && tab.key !== 'approvals' && tab.key !== 'activity' && tab.key !== 'owners');
  }

  if (isNonIndexedBalances) {
    tabInfo = tabInfo.filter(tab => tab.key !== 'approvals' && tab.key !== 'activity' && tab.key !== 'owners');
  }

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch collection ,collection page');
    async function fetchCollectionsFunc() {
      if (collectionIdNumber > 0) {
        await fetchCollections([collectionIdNumber]);
      }
    }
    if (isPreview) return;
    fetchCollectionsFunc();
  }, [collectionIdNumber, isPreview])

  useEffect(() => {

    //TODO: Warn if balances / metadata are out of sync?
    if (collection?.cachedCollectionMetadata?._isUpdating || collection?.cachedBadgeMetadata.find(badge => badge.metadata._isUpdating)) {

      if (!warned && !isPreview) {
        setWarned(true);
      }
    }
  }, [collection, warned, isPreview])

  const [populated, setPopulated] = useState(false);
  //Set tab to badges if badgeId is in query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set tab to claims');
    if (populated) return;
    if (code || password) {
      setTab('transferability');
      setPopulated(true);
    }
  }, [code, password, populated])


  return (
    <ReportedWrapper
      reported={!!collection?.reported ?? false}
      node={<>
        <Content
          style={{
            textAlign: 'center',
            minHeight: '100vh',
          }}
        >
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

              {/* Overview and Tabs */}
              {collectionMetadata && <CollectionHeader collectionId={collectionIdNumber} hideCollectionLink />}
              <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
              <br />

              {/* Tab Content */}
              {tab === 'overview' && (
                <OverviewTab collectionId={collectionIdNumber} setTab={setTab} />
              )}
              {tab === 'owners' && (
                <CollectionOwnersTab collectionId={collectionIdNumber} />
              )}
              {tab === 'badges' && (
                <BadgesTab collectionId={collectionIdNumber} />
              )}
              {tab === 'transferability' && !isOffChainBalances && !isNonIndexedBalances && (
                <TransferabilityTab collectionId={collectionIdNumber} />
              )}
              {tab === 'transferability' && (isOffChainBalances || isNonIndexedBalances) && (
                <OffChainTransferabilityTab collectionId={collectionIdNumber} />
              )}


              {isPreview && (tab === 'owners' || tab == 'history' || tab === 'actions' || tab === 'activity' || tab === 'announcements' || tab === 'reputation' || tab == 'approvals') && <Empty
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
                    await fetchNextForCollectionViews(collectionIdNumber, 'reviews', 'reviews');
                  }}
                  hasMore={collection?.views.reviews?.pagination.hasMore ?? true}
                />
              )}

              {tab === 'actions' && !isPreview && (
                <ActionsTab
                  collectionId={collectionIdNumber}
                />
              )}

              {tab === 'activity' && !isPreview && collection && (
                <ActivityTab
                  activity={getCollectionActivityView(collection, 'transferActivity') ?? []}
                  fetchMore={async () => {
                    await fetchNextForCollectionViews(collectionIdNumber, 'transferActivity', 'transferActivity');
                  }}
                  hasMore={collection?.views.transferActivity?.pagination.hasMore ?? true}
                />
              )}

              {tab === 'history' && !isPreview && <div className='primary-text'>
                <br />
                {collection.updateHistory.sort((a, b) => Number(a.blockTimestamp) > Number(b.blockTimestamp) ? -1 : 1).map((update, i) => {
                  return <TxHistory key={i} tx={update} creationTx={i == collection.updateHistory.length - 1} />
                })}
              </div>}
            </>
            }
          </div>
          <Divider />
        </Content>
      </>}
    />
  );
}

export default CollectionPage;
