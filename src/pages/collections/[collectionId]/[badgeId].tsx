import { Col, Divider, Layout, Row } from 'antd';
import { BitBadgesCollection, TransferActivityDoc, getCurrentValuesForCollection, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeActivity } from '../../../bitbadges-api/api';

import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { DistributionOverview } from '../../../components/badges/DistributionCard';
import { MetadataDisplay } from '../../../components/badges/MetadataInfoDisplay';
import { ActionsTab } from '../../../components/collection-page/ActionsTab';
import { BalanceChecker, SpecificBadgeOwnersTab } from '../../../components/collection-page/OwnersTab';
import { PermissionsOverview } from '../../../components/collection-page/PermissionsInfo';
import { ActivityTab } from '../../../components/collection-page/TransferActivityDisplay';
import { TransferabilityTab } from '../../../components/collection-page/TransferabilityTab';
import { Tabs } from '../../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../../constants';

import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchAndUpdateMetadata, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { OffChainTransferabilityTab } from '../../../components/collection-page/OffChainTransferabilityTab';
import { ReportedWrapper } from '../../../components/wrappers/ReportedWrapper';

const { Content } = Layout;

export function BadgePage({ collectionPreview }
  : {
    collectionPreview?: BitBadgesCollection<bigint>
  }) {
  const router = useRouter()

  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState<TransferActivityDoc<bigint>[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [bookmark, setBookmark] = useState<string>('');

  const { collectionId, badgeId } = router.query;

  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId ? BigInt(collectionId as string) : isPreview ? NEW_COLLECTION_ID : -1n;
  const badgeIdNumber = badgeId && !isPreview ? BigInt(badgeId as string) : -1n;

  const collection = useCollection(isPreview ? undefined : collectionIdNumber);
  const metadata = collection ? getMetadataForBadgeId(badgeIdNumber, collection.cachedBadgeMetadata) : undefined;
  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No Balances");

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get collection info, badge page');
    if (isPreview) return;
    if (collectionIdNumber > 0) {
      fetchAndUpdateMetadata(collectionIdNumber, { badgeIds: [{ start: badgeIdNumber, end: badgeIdNumber }] });
    }
  }, [collectionIdNumber, isPreview, badgeIdNumber]);

  useEffect(() => {
    if (isPreview || !collection) return;
    const managers = collection.managerTimeline.map(x => x.manager).filter(x => x);
    fetchAccounts([collection.createdBy, ...managers]);
  }, [collection, isPreview]);

  // const isOffChainBalances = collection && collection.balancesType == "Off-Chain - Indexed" ? true : false;
  const isNonIndexedBalances = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;

  let tabInfo = []
  tabInfo.push(
    { key: 'overview', content: 'Overview' },
    { key: 'owners', content: 'Owners', disabled: false },
    { key: 'transferability', content: 'Transferability' },
    { key: 'activity', content: 'Activity' },
    { key: 'actions', content: 'Actions' },
  );

  if (noBalancesStandard || isNonIndexedBalances) {
    tabInfo = tabInfo.filter(tab => tab.key !== 'transferability' && tab.key !== 'approvals' && tab.key !== 'activity' && tab.key !== "owners")
  }

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
            style={{
              marginLeft: !isPreview ? '3vw' : undefined,
              marginRight: !isPreview ? '3vw' : undefined,
              paddingLeft: !isPreview ? '1vw' : undefined,
              paddingRight: !isPreview ? '1vw' : undefined,
              paddingTop: '20px',
            }}
          >


            {metadata && <CollectionHeader collectionId={collectionIdNumber} badgeId={badgeIdNumber} />}

            <Tabs tab={tab} tabInfo={tabInfo} setTab={setTab} theme="dark" fullWidth />

            {tab === 'transferability' && (
              <>{collection?.balancesType == 'Off-Chain - Indexed' ? <OffChainTransferabilityTab collectionId={collectionIdNumber} /> : <TransferabilityTab collectionId={collectionIdNumber} badgeId={badgeIdNumber} />}
              </>)}

            {tab === 'owners' && collection && (<>
              <SpecificBadgeOwnersTab collectionId={collectionIdNumber} badgeId={badgeIdNumber} />
            </>)}

            {tab === 'overview' && (<>
              <br />


              {collection &&
                <div className='flex-center'>
                  <Row className='flex-between full-width' style={{ alignItems: 'normal' }}>
                    <Col md={12} xs={24} sm={24} style={{ minHeight: 100, }}>

                      {!noBalancesStandard && <>
                        <MetadataDisplay
                          collectionId={collectionIdNumber}
                          badgeId={badgeIdNumber}
                          span={24}
                        />
                      </>}
                      {collection &&
                        <PermissionsOverview
                          collectionId={collectionIdNumber}
                          badgeId={badgeIdNumber}
                          span={24}
                        />
                      }

                    </Col>
                    <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
                    <Col md={12} xs={24} sm={24} style={{ minHeight: 100, flexDirection: 'column' }}>
                      {!noBalancesStandard && <>
                        <DistributionOverview
                          collectionId={collectionIdNumber}
                          span={24}
                          badgeId={badgeIdNumber}
                        />

                        {collection && <BalanceChecker
                          collectionId={collectionIdNumber}
                          badgeId={badgeIdNumber}
                          setTab={setTab}
                        />}
                      </>}
                      {noBalancesStandard && <>{collection &&
                        <MetadataDisplay
                          collectionId={collectionIdNumber}
                          badgeId={badgeIdNumber}
                          span={24}
                        />
                      }</>}
                    </Col>
                  </Row>
                </div>
              }
            </>
            )}

            {tab === 'activity' && collection && (<>
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

            {tab === 'actions' && (<>
              <ActionsTab collectionId={collectionIdNumber} badgeView />
            </>
            )}
          </div>
          <Divider />
        </Content>
      </>}
    />
  );
}

export default BadgePage;