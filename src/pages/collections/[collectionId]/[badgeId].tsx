import { InfoCircleOutlined } from '@ant-design/icons';
import { faSnowflake, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Divider, Layout, Row, Tooltip, Typography } from 'antd';
import { AllAddressesTransferMapping, BitBadgeCollection, TransferActivityItem, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { getBadgeActivity } from '../../../bitbadges-api/api';
import { ActivityTab } from '../../../components/activity/ActivityDisplay';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../../components/badges/MetadataInfoDisplay';
import { BadgeButtonDisplay } from '../../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../../components/collection-page/ActionsTab';
import { ClaimsTab } from '../../../components/collection-page/ClaimsTab';
import { OwnersTab } from '../../../components/collection-page/OwnersTab';
import { PermissionsOverview } from '../../../components/collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../../components/display/InformationDisplayCard';
import { Tabs } from '../../../components/navigation/Tabs';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../../constants';
import { useCollectionsContext } from '../../../contexts/CollectionsContext';
import MarkdownIt from 'markdown-it';
import HtmlToReact from 'html-to-react';

const mdParser = new MarkdownIt(/* Markdown-it options */);

const { Content } = Layout;



export function BadgePage({ collectionPreview }
  : {
    collectionPreview?: BitBadgeCollection
  }) {
  const router = useRouter()
  const collections = useCollectionsContext();

  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState<TransferActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [bookmark, setBookmark] = useState<string>('');

  const { collectionId, badgeId } = router.query;

  const isPreview = collectionPreview ? true : false;

  const collectionIdNumber = collectionId && !isPreview ? Number(collectionId) : -1;
  const badgeIdNumber = badgeId && !isPreview ? Number(badgeId) : -1;

  const collection = isPreview ? collectionPreview : collections.collections[`${collectionIdNumber}`]?.collection;
  const metadata = collection ? getMetadataForBadgeId(Number(badgeId), collection.badgeMetadata) : undefined;

  //Get collection information
  useEffect(() => {
    if (isPreview) return;
    if (collectionIdNumber > 0) {
      collections.fetchCollections([collectionIdNumber]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionIdNumber]);

  const tabInfo = []
  if (collection?.standard === 0) {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      // { key: 'collection', content: 'Collection' },
      { key: 'claims', content: 'Claims' },
      { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  } else {
    tabInfo.push(
      { key: 'overview', content: 'Overview' },
      // { key: 'collection', content: 'Collection' },
      // { key: 'claims', content: 'Claims' },
      { key: 'activity', content: 'Activity' },
      { key: 'actions', content: 'Actions' },
    );
  }

  const isTransferable = !collection?.disallowedTransfers?.length;
  const isNonTransferable = collection?.disallowedTransfers?.length === 1
    && JSON.stringify(collection?.disallowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
    && JSON.stringify(collection?.disallowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

  const isOffChainBalances = collection?.standard == 1;

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(metadata?.description ? metadata?.description : ''));

  return (

    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            marginLeft: !isPreview ? '7vw' : undefined,
            marginRight: !isPreview ? '7vw' : undefined,
            paddingLeft: !isPreview ? '1vw' : undefined,
            paddingRight: !isPreview ? '1vw' : undefined,
            paddingTop: '20px',
            background: PRIMARY_BLUE,
          }}
        >
          <BadgeButtonDisplay website={metadata?.externalUrl} />

          {metadata &&
            <CollectionHeader
              metadata={metadata}
              collection={collection}
            />
          }

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
              collection={collection}
              refreshUserBalance={
                async () => { } //TODO:
              }
              badgeId={badgeIdNumber}
            />
          </>}


          {tab === 'overview' && (<>
            <br />


            {collection &&
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Row
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, }}>
                    <MetadataDisplay
                      collection={collection}
                      metadata={metadata}
                      badgeId={badgeIdNumber}
                      span={24}
                    />
                    <br />
                    {!isOffChainBalances && <>
                      <InformationDisplayCard
                        title={<>
                          Transferability
                          <Tooltip title="Which badge owners can transfer to which badge owners?">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                          {!collection?.permissions.CanUpdateDisallowed ?
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
                            isTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Transferable</Typography.Text> : <>
                              {isNonTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Non-Transferable</Typography.Text>
                                : <>                                        {
                                  collection?.disallowedTransfers.map((transfer) => {
                                    return <>
                                      The addresses with account IDs {transfer.from.accountIds.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                      })} {transfer.from.options === 1 ? '(including the manager)' : transfer.from.options === 2 ? '(excluding the manager)' : ''} cannot
                                      transfer to the addresses with account IDs {transfer.to.accountIds.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                      })} {transfer.to.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''}.
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
                    </>}
                    {collection &&
                      <PermissionsOverview
                        collection={collection}
                        isBadgeView
                        span={24}
                        isUserList={true}
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
                          <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >
                            <Markdown>
                              {reactElement}
                            </Markdown>
                          </div>
                        </div>
                      </InformationDisplayCard>
                      <br />
                    </>}

                    {collection && <OwnersTab
                      collection={collection}
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
              collection={{
                ...collection,
                activity: activity as TransferActivityItem[],
              }}
              badgeId={badgeIdNumber}
              fetchMore={async () => {
                const activityRes = await getBadgeActivity(collectionIdNumber, badgeIdNumber, bookmark);
                if (activityRes) {
                  setActivity([...activity, ...activityRes.activity]);
                  setHasMore(activityRes.pagination.activity.hasMore);
                  setBookmark(activityRes.pagination.activity.bookmark);
                }
              }}
              hasMore={hasMore}
            />
          </>
          )}

          {tab === 'actions' && collection && (<>
            <ActionsTab
              collection={collection}
              refreshUserBalance={async () => { } //TODO:
              }
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