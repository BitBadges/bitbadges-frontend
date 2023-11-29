import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Col, Collapse, Row, Spin, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { TransferActivityInfo } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { DesiredNumberType } from '../../bitbadges-api/api';


import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE, NODE_API_URL } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { EmptyIcon } from '../common/Empty';
import { Pagination } from '../common/Pagination';
import IconButton from '../display/IconButton';
import { TransferDisplay } from '../transfers/TransferDisplay';

function PanelHeaderAddresses({ addresses }: { addresses: string[] }) {
  return <div className='flex-center flex-column'>
    {addresses.length > 1 ?
      <div className='flex-center flex-column'>
        <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>{addresses.length} Addresses</Typography.Text>
      </div>
      : <>{addresses.map((x, i) => <AddressDisplay key={i} addressOrUsername={x} fontSize={17} />)}</>}
  </div>
}


function PanelHeader({ collectionId, activity, onDelete, idx }: { idx: number, collectionId: bigint, activity: TransferActivityInfo<DesiredNumberType>, onDelete?: (idx: number) => void }) {
  const router = useRouter();
  const collection = useCollection(collectionId);

  let numBadgesTransferred = 0n;
  activity.balances.forEach(balance => {
    for (const badgeIdRange of balance.badgeIds) {
      numBadgesTransferred += badgeIdRange.end - badgeIdRange.start + 1n;
    }
  });

  return <>
    <div className='flex-between' style={{ width: '100%' }}>
      <div className='primary-text'>
        <div className='flex' style={{ display: 'flex', alignItems: 'center' }}>
          {collection?.balancesType === 'Standard' ? <>
            <PanelHeaderAddresses addresses={[activity.from]} />
            <b style={{ marginRight: 8, marginLeft: 8 }}>to</b>
          </> :
            <></>}

          <PanelHeaderAddresses addresses={activity.to} />
          <b style={{ marginRight: 8, marginLeft: 8 }}>
            {/* Calculate number of badges transferred */}
            ({numBadgesTransferred.toString()} Badge{numBadgesTransferred === 1n ? '' : 's'})
          </b>
        </div>
        <div
          className='primary-text'
          style={{
            marginTop: 4,
            fontSize: 14,
            fontWeight: 'bolder',
            whiteSpace: 'normal',
            textAlign: 'left',
          }}

        >
          <a onClick={(e) => {
            router.push(`/collections/${activity.collectionId}`);
            e.stopPropagation();
          }}>
            {collection?.cachedCollectionMetadata?.name}
          </a>
          {' - '}
          {collection?.balancesType === 'Standard' ? activity.method : 'Balance Update'} ({new Date(Number(activity.timestamp)).toLocaleDateString()} {new Date(Number(activity.timestamp)).toLocaleTimeString()})


        </div>

      </div>
      <div>
        {onDelete && <IconButton src={<DeleteOutlined />} onClick={() => onDelete(idx)} text='' tooltipMessage='Delete' />}
      </div>
    </div>
  </>
}


function CollapseComponent({ activity, onDelete, paginated, currPage, numShown, hasMore }: {
  activity: TransferActivityInfo<DesiredNumberType>[],
  onDelete?: (idx: number) => void
  paginated?: boolean
  hasMore: boolean
  currPage: number,
  numShown: number
}) {

  return <>{/** No activity */}
    {activity.length === 0 && !hasMore && <EmptyIcon description='No Activity' />}

    {/** Activity Collapse Panel */}
    {
      activity.length > 0 &&
      <Collapse
        className='full-width primary-text'
        style={{ alignItems: 'center' }}
        expandIconPosition='start'
      >
        {activity.map((activity, idx) => {
          if (paginated) {
            if (idx < (currPage - 1) * 10) return <></>;
            if (idx >= currPage * 10) return <></>;
          } else {
            if (idx >= numShown) return <></>;
          }

          const collectionId = activity.collectionId;


          return <CollapsePanel
            key={idx}
            className='full-width card-bg'
            header={<>
              <PanelHeader collectionId={collectionId} activity={activity} onDelete={onDelete} idx={idx} />
            </>
            }
          >
            {
              <div className='full-width card-bg'>
                <br />
                <div className='flex-center primary-text'>
                  <div key={idx} className='primary-text'>
                    <Row>
                      <Col span={24}>
                        {activity.balances.length == 0 && <div className='secondary-text'>
                          <InfoCircleOutlined /> This user previously owned badges in this collection, but their balance has now been updated to own none.
                        </div>}

                        <TransferDisplay
                          key={idx}
                          doNotCalculate
                          collectionId={collectionId}
                          initiatedBy={activity.initiatedBy}
                          transfers={[
                            {
                              from: activity.from,
                              toAddresses: activity.to,
                              balances: activity.balances,
                              memo: activity.memo,
                              precalculateBalancesFromApproval: activity.precalculateBalancesFromApproval,
                              merkleProofs: [],
                              prioritizedApprovals: [],
                              onlyCheckPrioritizedApprovals: false,
                            }
                          ]}
                        />

                        <br />
                        {activity.txHash &&
                          <p><a href={NODE_API_URL + '/cosmos/tx/v1beta1/txs/' + activity.txHash} target='_blank' rel='noopener noreferrer'>
                            See Blockchain Transaction
                          </a></p>
                        }
                      </Col>
                    </Row>
                  </div>
                </div>
              </div>
            }
          </CollapsePanel>
        })}
      </Collapse>
    }</>
}


export function ActivityTab({ activity, fetchMore, hasMore, onDelete, paginated }: {
  activity: TransferActivityInfo<DesiredNumberType>[],
  fetchMore: () => Promise<void>,
  hasMore: boolean,
  onDelete?: (idx: number) => void
  paginated?: boolean
}) {
  const [numShown, setNumShown] = useState(10);
  const [currPage, setCurrPage] = useState(1);

  //Shows 10 at a time even if we have like length 1000 activity
  //Only fetches more from source when we have run out of +10s
  const fetchMoreWrapper = async () => {
    if (activity.length > numShown) {
      setNumShown(Math.min(numShown + 10, activity.length));
    } else {
      await fetchMore();
      setNumShown(numShown + 10);
    }
  }

  useEffect(() => {
    if (hasMore) {
      fetchMoreWrapper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Fetch the accounts and collections for the activity
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: activity display');
    async function getActivity() {
      if (!activity) return;

      const currActivityToDisplay = paginated ? activity.slice((currPage - 1) * 10, currPage * 10) : activity.slice(0, numShown);

      //We only fetch accounts for the panel headers, so if not displayed we don't fetch
      const accountsToFetch = [...new Set(currActivityToDisplay.map(a => { return [...new Set([a.from, a.to.length > 1 ? 'Mint' : a.to[0]])].filter(a => a !== 'Mint') }).flat())];
      const collectionsToFetch = currActivityToDisplay.map(a => a.collectionId).filter(x => x > 0n);

      await fetchCollections(collectionsToFetch);
      await fetchAccounts(accountsToFetch);
    }
    getActivity();
  }, [activity, numShown, currPage, paginated]);


  return (
    <div className='full-width'>
      <div className='flex-center primary-text'>
        {!paginated ?
          <InfiniteScroll
            dataLength={numShown}
            next={fetchMoreWrapper}
            hasMore={hasMore || numShown < activity.length}
            loader={
              <div>
                <Spin size={'large'} />
              </div>
            }
            scrollThreshold={"300px"}
            endMessage={<></>}
            initialScrollY={0}
            className='full-width'
            style={{ overflow: 'hidden' }}
          >
            <CollapseComponent activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
          </InfiniteScroll>
          : <>
            <div className='full-width'>
              <Pagination currPage={currPage} onChange={setCurrPage} total={activity.length} pageSize={10} showPageJumper />
              <br />
              <CollapseComponent activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
            </div>
          </>}
      </div>

      <DevMode obj={activity} />
    </div >
  );
}
