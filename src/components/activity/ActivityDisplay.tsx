import { Col, Collapse, Divider, Empty, Row, Spin, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { BitBadgeCollection, TransferActivityItem, filterBadgeActivityForBadgeId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { BLANK_USER_INFO, DEV_MODE, INFINITE_LOOP_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { TransferDisplay } from '../transfers/TransferDisplay';

enum ActivityType {
  Collection,
  Badge,
  User,
}

export function ActivityTab({ collection, badgeId, userActivity, fetchMore, hasMore }: {
  collection: BitBadgeCollection;
  badgeId?: number
  userActivity?: TransferActivityItem[],
  fetchMore: () => void,
  hasMore: boolean
}) {
  const accounts = useAccountsContext();
  const router = useRouter();
  const collections = useCollectionsContext();

  //We have three categories of activity that we can display, dependent on the props
  //1. User activity (spanning multiple collections (will specify collectionId))
  //2. Activity for a specific badge (one collection and filtered by a specific badgeId)
  //3. Activity for a collection (all badges in the collection)
  let activityType = ActivityType.User;
  let activity: (TransferActivityItem)[];
  if (userActivity) {
    activity = userActivity;
  } else {
    //If we are showing a badge's activity, filter the activity to only show that badge's activity
    //Note this is probably unnecessary now that we have the getBadgeActivity route, but it doesn't hurt
    if (badgeId && collection) {
      activityType = ActivityType.Badge;
      activity = filterBadgeActivityForBadgeId(badgeId, collection?.activity);
    } else if (collection) {
      activityType = ActivityType.Collection;
      activity = collection.activity;
    } else {
      activity = [];
    }
  }

  // Fetch the accounts and collections for the activity
  useEffect(() => {
    async function getActivity() {
      if (!activity) return;

      const accountsToFetch: number[] = activity.map(a => {
        return [...new Set([...a.from, ...a.to])].filter(a => a !== 'Mint').map(a => Number(a));
      }).flat();
      const collectionsToFetch: number[] = activity.map(a => a.collectionId);

      await collections.fetchCollections(collectionsToFetch);
      await accounts.fetchAccountsByNumber(accountsToFetch);

      if (INFINITE_LOOP_MODE) console.log("ActivityDisplay");
    }
    getActivity();
  }, [activity, accounts, collections]);


  // Gets the address to display on the panel header (either address or "X addresses" if there are multiple)
  const getPanelHeaderAddress = (accountNums: (number | "Mint")[]) => {
    return <div className='flex-center flex-column'>
      {accountNums.length > 1 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 20 }}>
        <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 20 }}>{accountNums.length} Addresses</Typography.Text>
      </div>
        : <>
          {accountNums.map((x, i) => <AddressDisplay
            key={i}
            fontColor={PRIMARY_TEXT}
            userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[x]] || BLANK_USER_INFO}
          />)}
        </>}
    </div>
  }

  return (
    <div>
      <div className='flex-center' style={{
        color: PRIMARY_TEXT,
      }}>
        <InfiniteScroll
          dataLength={activity.length}
          next={fetchMore}
          hasMore={hasMore}
          loader={
            <div>
              <br />
              <Spin size={'large'} />
            </div>
          }
          scrollThreshold={"300px"}
          endMessage={
            <></>
          }
          initialScrollY={0}
          style={{ width: '100%', overflow: 'hidden' }}
        >
          {/** No activity */}
          {activity.length === 0 && !hasMore && <Empty
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
            description="No activity." image={Empty.PRESENTED_IMAGE_SIMPLE}
          />}

          {/** Activity Collapse Panel */}
          {activity.length > 0 && <Collapse
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%', alignItems: 'center' }}
            expandIconPosition='start'
          >
            {activity.map((activity, idx) => {
              const collectionId = activityType === ActivityType.User && activity.collectionId ? activity.collectionId : collection.collectionId
              const collectionToShow = activityType === ActivityType.User ? collections.collections[collectionId]?.collection : collection;

              return <CollapsePanel
                key={idx}
                header={
                  <Row style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                    <Col md={12} xs={24} sm={24} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      {getPanelHeaderAddress(activity.from)}
                      <b style={{ marginRight: 8 }}>to</b>
                      {getPanelHeaderAddress(activity.to)}
                    </Col>
                    <div>{activity.method} ({new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()})</div>
                  </Row>
                }
                style={{
                  width: '100%',
                }}
              >
                {collectionToShow && <div style={{ width: '100%' }}>
                  <br />
                  <div
                    style={{
                      color: PRIMARY_TEXT,
                      justifyContent: 'center',
                      display: 'flex'
                    }}>

                    <div key={idx} style={{ color: PRIMARY_TEXT }}>
                      <Row>
                        <Col span={24}>
                          <h2 style={{ color: PRIMARY_TEXT }}>Transaction Type: {activity.method}</h2>
                          {activity.collectionId && collection && <div
                            style={{
                              fontSize: 14,
                              color: PRIMARY_TEXT,
                              fontWeight: 'bolder',
                              whiteSpace: 'normal'
                            }}
                            onClick={(e) => {
                              router.push(`/collections/${activity.collectionId}`);
                              e.stopPropagation();
                            }}
                          >
                            <a>
                              {collections.collections[`${activity.collectionId}`]?.collection.collectionMetadata.name}
                            </a>
                          </div>}

                          <TransferDisplay
                            fontColor={PRIMARY_TEXT}
                            key={idx}
                            collection={collectionToShow}
                            from={activity.from.map((from) => {
                              return accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]] || BLANK_USER_INFO
                            })}
                            transfers={[
                              {
                                toAddresses: activity.to.map((x) => Number(x)),
                                toAddressInfo: activity.to.map((to) => {
                                  return accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]] || BLANK_USER_INFO
                                }),
                                balances: activity.balances
                              }
                            ]}
                            setTransfers={() => { }}
                          />
                          <Divider />
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
                }
              </CollapsePanel>
            })}
          </Collapse>}
        </InfiniteScroll>
      </div>

      {
        DEV_MODE &&
        <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
          {JSON.stringify(collection, null, 2)}
        </pre>
      }
    </div >
  );
}
