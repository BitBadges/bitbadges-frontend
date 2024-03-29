import { Divider, Empty, Layout } from 'antd';
import { TransferActivityDoc } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeActivity } from '../../../bitbadges-api/api';

import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { ActionsTab } from '../../../components/collection-page/ActionsTab';
import { SpecificBadgeOwnersTab } from '../../../components/collection-page/OwnersTab';
import { ActivityTab } from '../../../components/collection-page/TransferActivityDisplay';
import { Tabs } from '../../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../../constants';

import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchAndUpdateMetadata, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { OverviewTab } from '../../../components/collection-page/OverviewTab';
import { ReportedWrapper } from '../../../components/wrappers/ReportedWrapper';

const { Content } = Layout;

export function BadgePage({ collectionPreview, badgeIdOverride }: { collectionPreview?: boolean; badgeIdOverride?: bigint }) {
  const router = useRouter();

  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState<Array<TransferActivityDoc<bigint>>>([]);
  const [hasMore, setHasMore] = useState(true);
  const [bookmark, setBookmark] = useState<string>('');

  const { collectionId, badgeId } = router.query;

  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId ? BigInt(collectionId as string) : isPreview ? NEW_COLLECTION_ID : -1n;
  const badgeIdNumber = badgeId && !isPreview ? BigInt(badgeId as string) : badgeIdOverride ? badgeIdOverride : -1n;

  const collection = useCollection(collectionIdNumber);
  const metadata = collection ? collection.getBadgeMetadata(badgeIdNumber) : undefined;
  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get collection info, badge page');
    if (isPreview) return;
    if (collectionIdNumber > 0) {
      fetchAndUpdateMetadata(collectionIdNumber, {
        badgeIds: [{ start: badgeIdNumber, end: badgeIdNumber }]
      });
    }
  }, [collectionIdNumber, isPreview, badgeIdNumber]);

  useEffect(() => {
    if (isPreview || !collection) return;
    const managers = collection.managerTimeline.map((x) => x.manager).filter((x) => x);
    fetchAccounts([collection.createdBy, ...managers]);
  }, [collection, isPreview]);

  const isNonIndexedBalances = collection && collection.balancesType == 'Off-Chain - Non-Indexed' ? true : false;

  let tabInfo = [];
  tabInfo.push(
    { key: 'overview', content: 'Overview' },
    { key: 'owners', content: 'Owners', disabled: false },
    { key: 'activity', content: 'Activity' },
    { key: 'actions', content: 'Actions' }
  );

  if (noBalancesStandard || isNonIndexedBalances) {
    tabInfo = tabInfo.filter((tab) => tab.key !== 'approvals' && tab.key !== 'activity' && tab.key !== 'owners');
  }

  if (noBalancesStandard) {
    tabInfo = tabInfo.filter((tab) => tab.key !== 'transferability');
  }

  return (
    <ReportedWrapper
      reported={!!collection?.reported ?? false}
      node={
        <>
          <Content
            style={{
              textAlign: 'center',
              minHeight: '100vh'
            }}
          >
            <div
              style={{
                marginLeft: !isPreview ? '3vw' : undefined,
                marginRight: !isPreview ? '3vw' : undefined,
                paddingLeft: !isPreview ? '1vw' : undefined,
                paddingRight: !isPreview ? '1vw' : undefined,
                paddingTop: '20px'
              }}
            >
              {metadata && <CollectionHeader collectionId={collectionIdNumber} badgeId={badgeIdNumber} />}

              <Tabs tab={tab} tabInfo={tabInfo} setTab={setTab} theme="dark" fullWidth />
              {isPreview &&
                (tab === 'owners' ||
                  tab == 'history' ||
                  tab === 'actions' ||
                  tab === 'activity' ||
                  tab === 'announcements' ||
                  tab === 'reputation' ||
                  tab == 'approvals') && (
                  <Empty className="primary-text" description={'This tab is not supported for previews.'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}

              {tab === 'owners' && !isPreview && collection && (
                <>
                  <SpecificBadgeOwnersTab collectionId={collectionIdNumber} badgeId={badgeIdNumber} />
                </>
              )}

              {tab === 'overview' && (
                <>
                  <br />
                  {collection && (
                    <div className="flex-center">
                      <OverviewTab badgeId={badgeIdNumber} collectionId={collectionIdNumber} setTab={setTab} />
                    </div>
                  )}
                </>
              )}

              {tab === 'activity' && !isPreview && collection && (
                <>
                  <br />
                  <ActivityTab
                    activity={activity}
                    fetchMore={async () => {
                      const activityRes = await getBadgeActivity(collectionIdNumber, badgeIdNumber, { bookmark });
                      if (activityRes) {
                        setActivity([...activity, ...activityRes.activity]);
                        setHasMore(activityRes.pagination.hasMore);
                        setBookmark(activityRes.pagination.bookmark);
                      }
                    }}
                    hasMore={hasMore}
                  />
                </>
              )}

              {tab === 'actions' && !isPreview && <ActionsTab collectionId={collectionIdNumber} badgeView />}
            </div>
            <Divider />
          </Content>
        </>
      }
    />
  );
}

export default BadgePage;
