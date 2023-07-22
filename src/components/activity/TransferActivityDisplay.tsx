import { Col, Collapse, Divider, Row, Spin, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { TransferActivityInfo } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { DesiredNumberType } from '../../bitbadges-api/api';
import { INFINITE_LOOP_MODE } from '../../constants';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { EmptyIcon } from '../common/Empty';
import { TransferDisplay } from '../transfers/TransferDisplay';

export function ActivityTab({ activity, fetchMore, hasMore }: {
  activity: TransferActivityInfo<DesiredNumberType>[],
  fetchMore: () => void,
  hasMore: boolean
}) {
  const accounts = useAccountsContext();
  const accountsRef = useRef(accounts);
  const router = useRouter();
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);

  // Fetch the accounts and collections for the activity
  useEffect(() => {
    async function getActivity() {
      if (!activity) return;

      const accountsToFetch = activity.map(a => { return [...new Set([...a.from, ...a.to])].filter(a => a !== 'Mint') }).flat();
      const collectionsToFetch = activity.map(a => a.collectionId);

      await collectionsRef.current.fetchCollections(collectionsToFetch);
      await accountsRef.current.fetchAccounts(accountsToFetch);

      if (INFINITE_LOOP_MODE) console.log("ActivityDisplay");
    }
    getActivity();
  }, [activity]);


  // Gets the address to display on the panel header (either address or "X addresses" if there are multiple)
  const getPanelHeaderAddress = (addresses: (string)[]) => {
    return <div className='flex-center flex-column'>
      {addresses.length > 1 ?
        <div className='flex-center flex-column'>
          <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>{addresses.length} Addresses</Typography.Text>
        </div>
        : <>{addresses.map((x, i) => <AddressDisplay key={i} addressOrUsername={x} />)}</>}
    </div>
  }

  return (
    <div>
      <div className='flex-center primary-text'>
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
          endMessage={<></>}
          initialScrollY={0}
          className='full-width'
          style={{ overflow: 'hidden' }}
        >
          {/** No activity */}
          {activity.length === 0 && !hasMore && <EmptyIcon description='No Activity' />}

          {/** Activity Collapse Panel */}
          {activity.length > 0 &&
            <Collapse
              className='full-width primary-text primary-blue-bg'
              style={{ alignItems: 'center' }}
              expandIconPosition='start'
            >
              {activity.map((activity, idx) => {
                const collectionId = activity.collectionId;
                const collection = collections.collections[collectionId.toString()]

                return <CollapsePanel
                  key={idx}
                  className='full-width'
                  header={
                    <Row className='flex-between primary-text' style={{ textAlign: 'left' }} >
                      <Col md={12} xs={24} sm={24} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        {getPanelHeaderAddress([activity.from])}
                        <b style={{ marginRight: 8 }}>to</b>
                        {getPanelHeaderAddress(activity.to)}
                      </Col>
                      <div>{activity.method} ({new Date(activity.timestamp.toString()).toLocaleDateString()} {new Date(activity.timestamp.toString()).toLocaleTimeString()})</div>
                    </Row>
                  }
                >
                  {
                    <div className='full-width'>
                      <br />
                      <div className='flex-center primary-text'>
                        <div key={idx} className='primary-text'>
                          <Row>
                            <Col span={24}>
                              <h2 className='primary-text'>Transaction Type: {activity.method}</h2>
                              <div
                                className='primary-text'
                                style={{
                                  fontSize: 14,
                                  fontWeight: 'bolder',
                                  whiteSpace: 'normal'
                                }}
                                onClick={(e) => {
                                  router.push(`/collections/${activity.collectionId}`);
                                  e.stopPropagation();
                                }}
                              >
                                <a>
                                  {collection?.collectionMetadata?.name}
                                </a>
                              </div>
                              {collection &&
                                <TransferDisplay
                                  key={idx}
                                  collectionId={collectionId}
                                  transfers={[
                                    {
                                      from: activity.from,
                                      toAddresses: activity.to,
                                      balances: activity.balances,
                                      memo: activity.memo,
                                      precalculationDetails: activity.precalculationDetails,
                                      merkleProofs: [],
                                    }
                                  ]}
                                />
                              }
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

      <DevMode obj={activity} />
    </div >
  );
}
