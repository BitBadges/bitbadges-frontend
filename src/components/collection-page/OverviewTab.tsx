import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import { BalanceArray, TransferActivityDoc, UintRangeArray } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { BitBadgesApi } from '../../bitbadges-api/api';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { MetadataDisplay } from '../badges/MetadataInfoDisplay';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { Divider } from '../display/Divider';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';
import { BalanceOverview } from './BalancesInfo';
import { PermissionsOverview } from './PermissionsInfo';
import { ActivityTab } from './TransferActivityDisplay';
import { OffChainTransferabilityTab } from './transferability/OffChainTransferabilityTab';
import { TransferabilityTab } from './transferability/TransferabilityTab';
import { EmptyIcon } from '../common/Empty';

export function SupplyAndOwnersCard({
  collectionId,
  badgeId,
  isSelectStep,
  md
}: {
  md?: number;
  collectionId: bigint;
  badgeId?: bigint;
  isSelectStep: boolean;
}) {
  const collection = useCollection(collectionId);

  const [balanceTab, setBalanceTab] = useState(collection?.balancesType === 'Off-Chain - Non-Indexed' ? (badgeId ? 'User' : 'All') : 'Total');

  const defaultBalances = useMemo(() => {
    if (badgeId) {
      return collection?.defaultBalances.balances.getBalancesForId(badgeId);
    } else {
      return collection?.defaultBalances.balances;
    }
  }, [collection?.defaultBalances, badgeId]);

  const mintBalances = useMemo(() => {
    if (badgeId) {
      return collection?.getBadgeBalances('Mint')?.getBalancesForId(badgeId);
    } else {
      return collection?.getBadgeBalances('Mint');
    }
  }, [badgeId, collection]);

  const totalBalances = useMemo(() => {
    if (badgeId) {
      return collection?.getBadgeBalances('Total')?.getBalancesForId(badgeId);
    } else {
      return collection?.getBadgeBalances('Total');
    }
  }, [badgeId, collection]);

  useEffect(() => {
    if (isSelectStep && balanceTab !== 'Defaults' && defaultBalances?.length) {
      setBalanceTab('Defaults');
    }
  }, [isSelectStep, balanceTab, defaultBalances]);

  if (!collection) return <></>;

  let tabInfos = [
    { key: 'Total', content: 'Total Supply' },
    { key: 'Mint', content: 'Unminted' },
    { key: 'User', content: 'Owners' }
  ];

  if (collection.defaultBalances.balances.length > 0) {
    tabInfos.unshift({ key: 'Defaults', content: 'Defaults' });
  }

  if (collection.balancesType === 'Off-Chain - Non-Indexed') {
    tabInfos = tabInfos.filter((x) => x.key === 'User');
    if (!badgeId) tabInfos.unshift({ key: 'All', content: 'Badges' });
  }

  if (isSelectStep) {
    if (defaultBalances?.length === 0) {
      tabInfos = tabInfos.filter((x) => x.key === 'Total');
    } else {
      tabInfos = tabInfos.filter((x) => x.key === 'Defaults');
    }
  }

  return (
    <>
      <InformationDisplayCard title="" md={md ?? 24} sm={24} xs={24}>
        <Tabs tab={balanceTab} fullWidth setTab={setBalanceTab} tabInfo={tabInfos} type="underline" />
        <br />
        {balanceTab === 'User' && <BalanceOverview collectionId={collectionId} badgeId={badgeId} />}
        {balanceTab === 'Defaults' && (
          <div className="secondary-text my-3">
            <InfoCircleOutlined /> All users are given these balances by default.
          </div>
        )}
        {balanceTab === 'All' && (
          <BadgeAvatarDisplay
            collectionId={collectionId}
            badgeIds={badgeId ? UintRangeArray.From([{ start: badgeId, end: badgeId }]) : collection.getBadgeIdRange()}
            showIds
          />
        )}

        {balanceTab !== 'User' && balanceTab !== 'All' && (
          <BalanceDisplay
            collectionId={collectionId}
            balances={
              (balanceTab === 'Defaults'
                ? defaultBalances
                : balanceTab === 'Mint'
                  ? mintBalances
                  : balanceTab === 'Total'
                    ? totalBalances
                    : BalanceArray.From([])) ?? BalanceArray.From([])
            }
            hideMessage
          />
        )}
      </InformationDisplayCard>
    </>
  );
}

export function OverviewTab({ collectionId, setTab, badgeId }: { collectionId: bigint; setTab: (tab: string) => void; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  const isPreview = collectionId === NEW_COLLECTION_ID;

  const [activityState, setActivity] = useState<Array<TransferActivityDoc<bigint>>>([]);

  const activity = useMemo(() => {
    if (!badgeId) {
      return collection?.getActivityView('transferActivity').slice(0, 10) ?? [];
    } else {
      return activityState;
    }
  }, [badgeId, collection, activityState]);

  useEffect(() => {
    async function fetchInitialActivity() {
      if (activity.length > 0) return;
      if (isPreview) return;

      if (collection && badgeId) {
        const activity = await BitBadgesApi.getBadgeActivity(collectionId, badgeId, { bookmark: '' });
        setActivity(activity.activity);
      } else if (collection) {
        const newColl = collection.clone();
        await newColl.fetchNextForView(BitBadgesApi, 'transferActivity', 'transferActivity');
        updateCollection(newColl);
      }
    }

    fetchInitialActivity();
  }, [collection, badgeId, collectionId, activity.length, isPreview]);

  if (!collection) return <></>;

  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');
  const MetadataDisplayElem = <MetadataDisplay collectionId={collectionId} span={24} badgeId={badgeId} />;

  return (
    <>
      <div></div>
      <Row
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}>
        <Col md={8} sm={24} xs={24}>
          {!noBalancesStandard && <SupplyAndOwnersCard collectionId={collectionId} badgeId={badgeId} isSelectStep={false} />}
          {MetadataDisplayElem}

          <PermissionsOverview collectionId={collectionId} span={24} badgeId={badgeId} />
        </Col>

        <Col md={16} sm={24} xs={24}>
          {collection.balancesType === 'Standard' && !noBalancesStandard && (
            <InformationDisplayCard title="Collection Transferability" md={24} sm={24} xs={24}>
              <TransferabilityTab collectionId={collectionId} />
            </InformationDisplayCard>
          )}
          {collection.balancesType !== 'Standard' && !noBalancesStandard && <OffChainTransferabilityTab collectionId={collectionId} />}
          {!noBalancesStandard && collection.balancesType !== 'Off-Chain - Non-Indexed' && (
            <InformationDisplayCard title="Recent Activity" md={24} sm={24} xs={24}>
              <br />
              {isPreview && (
                <div className="secondary-text">
                  <EmptyIcon description="Not supported for previews." />
                </div>
              )}
              {!isPreview && (
                <ActivityTab
                  activity={activity}
                  fetchMore={async () => {}}
                  hasMore={activity.length === 10}
                  // hasMore={true}
                  loader={
                    <>
                      {' '}
                      <Divider />
                      <span className="secondary-text">
                        Head over to the{' '}
                        <a
                          onClick={() => {
                            setTab('activity');
                          }}>
                          Activity
                        </a>{' '}
                        tab to see more.
                      </span>
                    </>
                  }
                />
              )}
            </InformationDisplayCard>
          )}
          {noBalancesStandard && (
            <InformationDisplayCard title="Badges" md={24} sm={24} xs={24}>
              <BadgeAvatarDisplay collectionId={collectionId} badgeIds={collection.getBadgeIdRange()} showIds />
            </InformationDisplayCard>
          )}
        </Col>
      </Row>
    </>
  );
}
