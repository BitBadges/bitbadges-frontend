import { DeleteOutlined } from '@ant-design/icons';
import { Col, Collapse, Row, Spin } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { BitBadgesAddressList, ListActivityDoc } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { DesiredNumberType, getAddressLists } from '../../bitbadges-api/api';


import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { EXPLORER_URL, INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { DevMode } from '../common/DevMode';
import { EmptyIcon } from '../common/Empty';
import { Pagination } from '../common/Pagination';
import IconButton from '../display/IconButton';
import { PanelHeaderAddresses } from './TransferActivityDisplay';



function PanelHeader({ addressLists, listId, activity, onDelete, idx }: {
  addressLists: BitBadgesAddressList<bigint>[],
  idx: number, listId: string, activity: ListActivityDoc<DesiredNumberType>, onDelete?: (idx: number) => void
}) {
  const router = useRouter();
  const list = addressLists.find(x => x.listId === listId);

  return <>
    <div className='flex' style={{ width: '100%' }}>
      {/* <div style={{marginRight: 16 }}>
        <BadgeAvatar
          collectionId={collectionId}
          metadataOverride={collection?.cachedCollectionMetadata}
          size={25}
          
        />
      </div> */}
      <div className='primary-text'>
        <div className='flex flex-wrap' style={{ display: 'flex', alignItems: 'center' }}>
          <PanelHeaderAddresses addresses={activity.addresses ?? []} />
        </div>
        <div
          className='secondary-text'
          style={{
            marginTop: 4,
            fontSize: 14,
            whiteSpace: 'normal',
            textAlign: 'left',
          }}

        >
          <a style={{ fontWeight: 'bolder' }} onClick={(e) => {
            router.push(`/lists/${activity.listId}`);
            e.stopPropagation();
          }}>
            {list?.metadata?.name ?? ''}
          </a>
          {' - '}
          {
            activity.addedToList ? `Added to ${list?.whitelist ? 'whitelist' : 'blacklist'}`
              : activity.addedToList === false ? `Removed from ${list?.whitelist ? 'whitelist' : 'blacklist'}`
                : activity.addedToList === undefined ? 'No change to whitelist/blacklist'
                  : 'Unknown'
          } at {new Date(Number(activity.timestamp)).toLocaleDateString()} {new Date(Number(activity.timestamp)).toLocaleTimeString()}


        </div>

      </div>
      <div>
        {onDelete && <IconButton src={<DeleteOutlined />} onClick={() => onDelete(idx)} text='' tooltipMessage='Delete' />}
      </div>
    </div>
  </>
}


function CollapseComponent({ activity, onDelete, paginated, currPage, numShown, hasMore, addressLists }: {
  activity: ListActivityDoc<DesiredNumberType>[],
  addressLists: BitBadgesAddressList<bigint>[],
  onDelete?: (idx: number) => void
  paginated?: boolean
  hasMore: boolean
  currPage: number,
  numShown: number
}) {
  const router = useRouter();

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

          const list = addressLists.find(x => x.listId === activity.listId);

          return <CollapsePanel
            key={idx}
            className='full-width card-bg'
            header={<>
              <PanelHeader activity={activity} onDelete={onDelete} idx={idx} listId={activity.listId} addressLists={addressLists} />
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
                        {list && <a

                          onClick={() => {
                            router.push(`/lists/${activity.listId}`);
                          }} style={{ fontWeight: 'bolder', fontSize: 24 }}>
                          {list.metadata?.name}
                        </a>}
                        <br />
                        The following users were{' '}
                        {
                          activity.addedToList ? `added to the ${list?.whitelist ? 'whitelist' : 'blacklist'}`
                            : activity.addedToList === false ? `removed from the ${list?.whitelist ? 'whitelist' : 'blacklist'}`
                              : activity.addedToList === undefined ? 'No change to whitelist/blacklist'
                                : 'Unknown'
                        } at {new Date(Number(activity.timestamp)).toLocaleDateString()} {new Date(Number(activity.timestamp)).toLocaleTimeString()
                        }
                        <br />
                        <br />
                        <AddressDisplayList users={activity.addresses ?? []} />

                        <br />
                        {activity.txHash &&
                          <p><a href={EXPLORER_URL + '/BitBadges/tx/' + activity.txHash} target='_blank' rel='noopener noreferrer'>
                            See Blockchain Transaction
                          </a></p>
                        }
                        <br />
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


export function ListActivityTab({ activity, fetchMore, hasMore, onDelete, paginated }: {
  activity: ListActivityDoc<DesiredNumberType>[],
  fetchMore: () => Promise<void>,
  hasMore: boolean,
  onDelete?: (idx: number) => void
  paginated?: boolean
}) {
  const [numShown, setNumShown] = useState(10);
  const [currPage, setCurrPage] = useState(1);

  const [addressLists, setAddressLists] = useState<BitBadgesAddressList<bigint>[]>([]);

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
      const accountsToFetch = [...new Set(currActivityToDisplay.filter(x => (x.addresses ?? []).length == 1).map(a => { return [...new Set([...a.addresses ?? []])].filter(a => a !== 'Mint') }).flat())];

      const listsToFetch = currActivityToDisplay.map(a => { return { listId: a.listId } }).filter(x => x);
      const listsRes = await getAddressLists({ listsToFetch });
      setAddressLists((curr) => {
        return [...curr, ...listsRes.addressLists].filter((x, idx, self) => self.findIndex(y => y.listId === x.listId) === idx)
      });
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
                <br />
                <Spin size={'large'} />
                <br />
                <br />
              </div>
            }
            scrollThreshold={"300px"}
            endMessage={<></>}
            initialScrollY={0}
            className='full-width'
            style={{ overflow: 'hidden' }}
          >
            <CollapseComponent
              addressLists={addressLists}
              activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
          </InfiniteScroll>
          : <>
            <div className='full-width'>
              <Pagination currPage={currPage} onChange={setCurrPage} total={activity.length} pageSize={10} showPageJumper />
              <br />
              <CollapseComponent
                addressLists={addressLists}
                activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
            </div>
          </>}
      </div>

      <DevMode obj={activity} />
    </div >
  );
}
