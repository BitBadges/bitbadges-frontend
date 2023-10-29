import { Col, Divider, Layout, Row } from 'antd';
import { BitBadgesCollection, TransferActivityInfo, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeActivity } from '../../../bitbadges-api/api';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { ActivityTab } from '../../../components/collection-page/TransferActivityDisplay';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { DistributionOverview } from '../../../components/badges/DistributionCard';
import { MetadataDisplay } from '../../../components/badges/MetadataInfoDisplay';
import { BadgeButtonDisplay } from '../../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../../components/collection-page/ActionsTab';
import { ClaimsTab } from '../../../components/collection-page/ClaimsTab';
import { OwnersTab } from '../../../components/collection-page/OwnersTab';
import { PermissionsOverview } from '../../../components/collection-page/PermissionsInfo';
import { TransferabilityTab } from '../../../components/collection-page/TransferabilityTab';
import { InformationDisplayCard } from '../../../components/display/InformationDisplayCard';
import { Tabs } from '../../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { useAccountsContext } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

export function BadgePage({ collectionPreview }
  : {
    collectionPreview?: BitBadgesCollection<bigint>
  }) {
  const router = useRouter()
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();


  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState<TransferActivityInfo<bigint>[]>([]);

  //TODO: Do within contexts
  const [hasMore, setHasMore] = useState(true);
  const [bookmark, setBookmark] = useState<string>('');

  const { collectionId, badgeId } = router.query;

  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId ? BigInt(collectionId as string) : isPreview ? NEW_COLLECTION_ID : -1n;
  const badgeIdNumber = badgeId && !isPreview ? BigInt(badgeId as string) : -1n;

  const collection = isPreview ? collectionPreview : collections.getCollection(collectionIdNumber);
  const metadata = collection ? getMetadataForBadgeId(badgeIdNumber, collection.cachedBadgeMetadata) : undefined;

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get collection info, badge page');
    if (isPreview) return;
    if (collectionIdNumber > 0) {
      collections.fetchAndUpdateMetadata(collectionIdNumber, { badgeIds: [{ start: badgeIdNumber, end: badgeIdNumber }] });
    }
  }, [collectionIdNumber, isPreview]);

  useEffect(() => {
    if (isPreview || !collection) return;
    const managers = collection.managerTimeline.map(x => x.manager).filter(x => x);
    accounts.fetchAccounts([collection.createdBy, ...managers]);
  }, [collection, isPreview]);

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const tabInfo = []
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      { key: 'transferability', content: 'Transferability' },
      { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  } else {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  }

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(metadata?.description ? metadata?.description : ''));

  return (
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
        <BadgeButtonDisplay website={metadata?.externalUrl} />

        {metadata && <CollectionHeader collectionId={collectionIdNumber} badgeId={badgeIdNumber} />}

        <Tabs tab={tab} tabInfo={tabInfo} setTab={setTab} theme="dark" fullWidth />

        {tab === 'claims' && collection && <>
          <br />
          <ClaimsTab
            collectionId={collectionIdNumber}

            badgeId={badgeIdNumber}
          />
        </>}
        {tab === 'transferability' && (
          <TransferabilityTab collectionId={collectionIdNumber} badgeId={badgeIdNumber} />
        )}


        {tab === 'overview' && (<>
          <br />


          {collection &&
            <div className='flex-center'>
              <Row className='flex-between full-width' style={{ alignItems: 'normal' }}>
                <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, }}>
                  {metadata?.description && <>
                    <InformationDisplayCard
                      title="About"
                    >
                      <div style={{ maxHeight: 200, overflow: 'auto' }} >
                        <div className='custom-html-style dark:text-white' id="description">
                          {reactElement}
                        </div>
                      </div>
                    </InformationDisplayCard>
                    <br />
                  </>}
                  <MetadataDisplay
                    collectionId={collectionIdNumber}
                    badgeId={badgeIdNumber}
                    span={24}
                  />
                  <br />
                  {collection &&
                    <PermissionsOverview
                      collectionId={collectionIdNumber}
                      badgeId={badgeIdNumber}
                      span={24}
                    />
                  }

                </Col>
                <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
                <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, flexDirection: 'column' }}>

                  <DistributionOverview
                    collectionId={collectionIdNumber}
                    span={24}
                    badgeId={badgeIdNumber}
                  />
                  <br />

                  {collection && <OwnersTab
                    collectionId={collectionIdNumber}
                    badgeId={badgeIdNumber}
                  />}
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
  );
}

export default BadgePage;