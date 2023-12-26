import { DeleteOutlined } from '@ant-design/icons';
import { Col, Collapse, Row, Spin, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { AddressMappingWithMetadata, ListActivityDoc } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { DesiredNumberType, getAddressMappings } from '../../bitbadges-api/api';


import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { INFINITE_LOOP_MODE, NODE_API_URL } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressListCard } from '../badges/AddressListCard';
import { DevMode } from '../common/DevMode';
import { EmptyIcon } from '../common/Empty';
import { Pagination } from '../common/Pagination';
import IconButton from '../display/IconButton';

function PanelHeaderAddresses({ addresses }: { addresses: string[] }) {
  return <div className='flex-center flex-column'>
    {addresses.length > 1 ?
      <div className='flex-center flex-column'>
        <Typography.Text className='primary-text' strong style={{ fontSize: 20 }}>{addresses.length} Addresses</Typography.Text>
      </div>
      : <>{addresses.map((x, i) => <AddressDisplay key={i} addressOrUsername={x} fontSize={17} />)}</>}
  </div>
}


function PanelHeader({ addressMappings, mappingId, activity, onDelete, idx }: {
  addressMappings: AddressMappingWithMetadata<bigint>[],
  idx: number, mappingId: string, activity: ListActivityDoc<DesiredNumberType>, onDelete?: (idx: number) => void }) {
  const router = useRouter();
  const mapping = addressMappings.find(x => x.mappingId === mappingId);

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
            router.push(`/addresses/${activity.mappingId}`);
            e.stopPropagation();
          }}>
            {mapping?.metadata?.name ?? ''}
          </a>
          {' - '}
          {
            activity.onList ? `Added to ${mapping?.includeAddresses ? 'whitelist' : 'blacklist'}`
              : activity.onList === false ? `Removed from ${mapping?.includeAddresses ? 'whitelist' : 'blacklist'}`
                : activity.onList === undefined ? 'No change to whitelist/blacklist'
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


function CollapseComponent({ activity, onDelete, paginated, currPage, numShown, hasMore, addressMappings }: {
  activity: ListActivityDoc<DesiredNumberType>[],
  addressMappings: AddressMappingWithMetadata<bigint>[],
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

          const mapping = addressMappings.find(x => x.mappingId === activity.mappingId);

          return <CollapsePanel
            key={idx}
            className='full-width card-bg'
            header={<>
              <PanelHeader activity={activity} onDelete={onDelete} idx={idx}  mappingId={activity.mappingId} addressMappings={addressMappings} />
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
                        {mapping &&  <AddressListCard addressMapping={mapping} />}

                        <br />
                        {activity.txHash &&
                          <p><a href={NODE_API_URL + '/cosmos/tx/v1beta1/txs/' + activity.txHash} target='_blank' rel='noopener noreferrer'>
                            See Blockchain Transaction
                          </a></p>
                        }
                        <br />
                        {/* {collection?.balancesType === 'Standard' ? activity.method : 'Balance Update'}   */}

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

  const [addressMappings, setAddressMappings] = useState<AddressMappingWithMetadata<bigint>[]>([]);

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
      const accountsToFetch = [...new Set(currActivityToDisplay.map(a => { return [...new Set([...a.addresses ?? []])].filter(a => a !== 'Mint') }).flat())];
      
      const mappingsToFetch = currActivityToDisplay.map(a => a.mappingId).filter(x => x);
      const mappingsRes = await getAddressMappings({ mappingIds: mappingsToFetch });
      setAddressMappings((curr) => {
        return [...curr, ...mappingsRes.addressMappings].filter((x, idx, self) => self.findIndex(y => y.mappingId === x.mappingId) === idx)
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
                <br/>
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
            addressMappings={addressMappings}
            activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
          </InfiniteScroll>
          : <>
            <div className='full-width'>
              <Pagination currPage={currPage} onChange={setCurrPage} total={activity.length} pageSize={10} showPageJumper />
              <br />
              <CollapseComponent
                addressMappings={addressMappings}
              activity={activity} onDelete={onDelete} paginated={paginated} hasMore={hasMore} currPage={currPage} numShown={numShown} />
            </div>
          </>}
      </div>

      <DevMode obj={activity} />
    </div >
  );
}
