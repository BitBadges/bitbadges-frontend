import { Col, Divider, Layout, Row } from 'antd';
import { BitBadgesCollection, TransferActivityInfo, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { getBadgeActivity } from '../../../bitbadges-api/api';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { ActivityTab } from '../../../components/activity/TransferActivityDisplay';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../../components/badges/MetadataInfoDisplay';
import { BadgeButtonDisplay } from '../../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../../components/collection-page/ActionsTab';
import { ClaimsTab } from '../../../components/collection-page/ClaimsTab';
import { OwnersTab } from '../../../components/collection-page/OwnersTab';
import { PermissionsOverview } from '../../../components/collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../../components/display/InformationDisplayCard';
import { Tabs } from '../../../components/navigation/Tabs';
import { MSG_PREVIEW_ID } from '../../../components/tx-timelines/TxTimeline';
import { DistributionOverview } from '../../../components/badges/DistributionCard';
import { TransferabilityTab } from '../../../components/collection-page/TransferabilityTab';
import { INFINITE_LOOP_MODE } from '../../../constants';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;

export function BadgePage({ collectionPreview }
  : {
    collectionPreview?: BitBadgesCollection<bigint>
  }) {
  const router = useRouter()
  const collections = useCollectionsContext();


  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState<TransferActivityInfo<bigint>[]>([]);

  //TODO: Do within contexts
  const [hasMore, setHasMore] = useState(true);
  const [bookmark, setBookmark] = useState<string>('');

  const { collectionId, badgeId } = router.query;

  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId ? BigInt(collectionId as string) : isPreview ? MSG_PREVIEW_ID : -1n;
  const badgeIdNumber = badgeId && !isPreview ? BigInt(badgeId as string) : -1n;

  const collection = isPreview ? collectionPreview : collections.collections[`${collectionIdNumber}`];
  const metadata = collection ? getMetadataForBadgeId(badgeIdNumber, collection.cachedBadgeMetadata) : undefined;

  //Get collection information
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get collection info, badge page');
    if (isPreview) return;
    if (collectionIdNumber > 0) {
      collections.fetchCollections([collectionIdNumber]);
    }
  }, [collectionIdNumber, isPreview]);

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const tabInfo = []
  if (!isOffChainBalances) {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      // { key: 'collection', content: 'Collection' },
      { key: 'transferability', content: 'Transferability' },
      { key: 'claims', content: 'Claims' },
      { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  } else {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      // { key: 'collection', content: 'Collection' },
      // { key: 'claims', content: 'Claims' },
      // { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  }

  // const isNonTransferable = !collection?.allowedTransfers?.length;
  // const isTransferable = collection?.allowedTransfers?.length === 1
  //   && JSON.stringify(collection?.allowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
  //   && JSON.stringify(collection?.allowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(metadata?.description ? metadata?.description : ''));

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
          className="primary-blue-bg"
          style={{
            marginLeft: !isPreview ? '7vw' : undefined,
            marginRight: !isPreview ? '7vw' : undefined,
            paddingLeft: !isPreview ? '1vw' : undefined,
            paddingRight: !isPreview ? '1vw' : undefined,
            paddingTop: '20px',
          }}
        >
          <BadgeButtonDisplay website={metadata?.externalUrl} />

          {metadata && <CollectionHeader collectionId={collectionIdNumber} badgeId={badgeIdNumber} />}

          <Tabs
            tab={tab}
            tabInfo={tabInfo}
            setTab={setTab}
            theme="dark"
            fullWidth
          />

          {tab === 'claims' && collection && <>
            <br />
            <ClaimsTab
              collectionId={collectionIdNumber}

              badgeId={badgeIdNumber}
            />
          </>}
          {tab === 'transferability' && (
            <TransferabilityTab collectionId={collectionIdNumber} setTab={setTab} badgeId={badgeIdNumber} />
          )}


          {tab === 'overview' && (<>
            <br />


            {collection &&
              <div className='flex-center'>
                <Row className='flex-between full-width' style={{ alignItems: 'normal' }}>
                  <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, }}>
                    <MetadataDisplay
                      collectionId={collectionIdNumber}
                      badgeId={badgeIdNumber}
                      span={24}
                    />
                    <br />
                    {/* {!isOffChainBalances && <>
                      <InformationDisplayCard
                        title={<>
                          Transferability
                          <Tooltip title="Which badge owners can transfer to which badge owners?">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                          {!collection?.collectionPermissions.CanUpdateAllowed ?
                            <Tooltip title="The transferability is frozen and can never be changed.">
                              <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faSnowflake} />
                            </Tooltip> :
                            <Tooltip title="Note that the manager can change the transferability.">
                              <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faUserPen} />
                            </Tooltip>
                          }
                        </>
                        }
                      >
                        <div style={{ margin: 8 }}>
                          {
                            isTransferable ? <Typography.Text style={{ fontSize: 20 }} className='primary-text'>Transferable</Typography.Text> : <>
                              {isNonTransferable ? <Typography.Text style={{ fontSize: 20 }} className='primary-text'>Non-Transferable</Typography.Text>
                                : <>                                        {
                                  collection?.allowedTransfers.map((transfer) => {
                                    return <>
                                      The addresses with account IDs {transfer.from.addresses.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range}</span>
                                      })} {transfer.from.managerOptions === 1n ? '(including the manager)' : transfer.from.managerOptions === 2n ? '(excluding the manager)' : ''} cannot
                                      transfer to the addresses with account IDs {transfer.to.addresses.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range}</span>
                                      })} {transfer.to.managerOptions === 1n ? '(including the manager)' : transfer.to.managerOptions === 2n ? '(excluding the manager)' : ''}.
                                      <br />
                                    </>
                                  })
                                }
                                </>
                              }
                            </>
                          }
                        </div>
                      </InformationDisplayCard>
                      <br />
                    </>} */}
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
                    {metadata?.description && <>
                      <InformationDisplayCard
                        title="About"
                      >
                        <div style={{ maxHeight: 200, overflow: 'auto' }} >
                          <div className='custom-html-style primary-text' id="description">
                            <Markdown>
                              {reactElement}
                            </Markdown>
                          </div>
                        </div>
                      </InformationDisplayCard>
                      <br />
                    </>}
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
            <ActionsTab
              collectionId={collectionIdNumber}
              badgeView
            />
          </>
          )}
        </div>
        <Divider />
      </Content>
    </Layout>
  );
}

export default BadgePage;