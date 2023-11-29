import { Empty, Spin } from 'antd';
import { BalanceInfo, Numberify, PaginationInfo, getBalancesForId } from 'bitbadgesjs-utils';
import { useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getOwnersForBadge } from '../../bitbadges-api/api';

import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts, getAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BalanceOverview } from './BalancesInfo';

export function OwnersTab({ collectionId, badgeId, setTab }: {
  collectionId: bigint;
  badgeId: bigint
  setTab?: (tab: string) => void;
}) {

  const collection = useCollection(collectionId)
  const isPreview = collection?.collectionId === NEW_COLLECTION_ID;

  const [loaded, setLoaded] = useState(false);
  const [owners, setOwners] = useState<BalanceInfo<bigint>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
    total: 0
  });

  const totalNumOwners = pagination.total ? Numberify(pagination.total) : 0;
  const fetchMore = useCallback(async (bookmark?: string) => {
    if (isPreview) return;

    const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: bookmark });

    const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]
    setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx));
    setPagination({
      ...ownersRes.pagination,
      total: (ownersRes.pagination.total ?? 0) - 2,
    });
  }, [collectionId, badgeId, isPreview]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (isPreview) return;

    fetchMore();
    setLoaded(true);
  }, [fetchMore, isPreview])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    fetchAccounts(owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map(x => getAccount(x.cosmosAddress)?.address ?? x.cosmosAddress));
  
  }, [owners]);

  return (<>
    <InformationDisplayCard
      title="Balance Checker"
    >
      {loaded ?
        <div className='primary-text flex-center flex-column'>
          {<div className='full-width'>


            <div className='flex'>
              <BalanceOverview
                collectionId={collectionId}
                badgeId={badgeId}
                setTab={setTab}
              />
            </div>
          </div>}
        </div>
        : <div>
          <br />
          <Spin size={'large'} />
          <br />
        </div>
      }
    </InformationDisplayCard>

    <InformationDisplayCard title="All Owners">
      <div className='primary-text flex-center flex-column'>
        <InfiniteScroll
          dataLength={owners.length}
          next={() => {
            fetchMore(pagination.bookmark)
          }}

          hasMore={isPreview ? false : pagination.hasMore}
          loader={<div>
            <br />
            <Spin size={'large'} />
          </div>}
          scrollThreshold="200px"
          endMessage={null}
          style={{ width: '100%' }}
        >
          {owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
            const account = getAccount(owner.cosmosAddress);
            return <TableRow
              key={idx}
              label={
                <div>
                  <AddressDisplay addressOrUsername={account?.address ?? ""} fontSize={16} />
                </div>
              } value={


                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    hideBadges
                    floatToRight
                    collectionId={collectionId}
                    showingSupplyPreview
                    hideMessage
                    balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, owner.balances).map(x => { return { ...x, badgeIds: [{ start: badgeId, end: badgeId }] } })
                      : owner.balances}
                  />
                </div>
              } labelSpan={12} valueSpan={12} />

          })}
        </InfiniteScroll>

        {totalNumOwners <= 0 && <Empty //<= 2 because of Mint and Total always being there
          description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className='primary-text'
        />}
      </div >

    </InformationDisplayCard>
  </>)
}