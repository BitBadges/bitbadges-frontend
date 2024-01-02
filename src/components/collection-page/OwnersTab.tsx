import { Empty, Spin } from 'antd';
import { BalanceDoc, PaginationInfo } from 'bitbadgesjs-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getOwnersForBadge } from '../../bitbadges-api/api';

import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchNextForCollectionViews, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { BalanceOverview } from './BalancesInfo';


export function CollectionOwnersTab({ collectionId }: {
  collectionId: bigint;
}) {
  const collection = useCollection(collectionId)
  const isPreview = collection?.collectionId === NEW_COLLECTION_ID;
  const isNonIndexedBalances = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;

  const owners = useMemo(() => {
    return (collection?.owners ?? []).filter(x => x.balances.length > 0 && x.balances.some(x => x.amount > 0));
  }, [collection?.owners]);

  const fetchMore = useCallback(async () => {
    if (isPreview) return;

    await fetchNextForCollectionViews(collectionId, 'owners', 'owners');
  }, [collectionId, isPreview]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (isPreview) return;

    fetchMore();
  }, [fetchMore, isPreview])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    if (owners && owners.length > 0) fetchAccounts(owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map(x => x.cosmosAddress));
  }, [owners]);

  const hasMore = collection?.views.owners?.pagination?.hasMore ?? true;

  return (<>
    {!isNonIndexedBalances && <>
      <InformationDisplayCard title="" inheritBg noBorder>
        <div className='primary-text flex-center flex-column'>
          <InfiniteScroll
            dataLength={owners.length}
            next={() => {
              fetchMore()
            }}
            className='flex-center flex-wrap full-width'
            hasMore={isPreview ? false : hasMore}
            loader={<div>
              <br />
              <Spin size={'large'} />
              <br />
              <br />
            </div>}
            scrollThreshold="200px"
            endMessage={null}
            style={{ width: '100%' }}
          >
            {owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
              return <BalanceCard key={idx} collectionId={collectionId} owner={owner} />
            })}
          </InfiniteScroll>

          {!hasMore && owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').length === 0 && <Empty //<= 2 because of Mint and Total always being there
            description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className='primary-text'
          />}
        </div >
      </InformationDisplayCard>
    </>}
  </>)
}

export const BalanceCard = ({ collectionId, owner }: {
  collectionId: bigint;
  owner: BalanceDoc<bigint>;
}) => {
  return <InformationDisplayCard md={8} xs={24} sm={24} title={<div className='flex-center'>
    <AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={24} />
  </div>}>
    <div className='primary-text flex-center flex-column'>
      <BalanceDisplay
        collectionId={collectionId}
        hideMessage
        balances={owner.balances}
      />
    </div>
  </InformationDisplayCard>
}

export function SpecificBadgeOwnersTab({ collectionId, badgeId }: {
  collectionId: bigint;
  badgeId: bigint
}) {
  const collection = useCollection(collectionId)
  const isPreview = collection?.collectionId === NEW_COLLECTION_ID;

  const [owners, setOwners] = useState<BalanceDoc<bigint>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
  });

  const isNonIndexedBalances = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;

  const fetchMore = useCallback(async (bookmark?: string) => {
    if (isPreview) return;

    if (badgeId) {
      const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: bookmark });

      const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]
      setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx).filter(x => x.balances.length > 0 && x.balances.some(x => x.amount > 0)));
      setPagination({
        ...ownersRes.pagination,
      });
    }
  }, [collectionId, badgeId, isPreview]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (isPreview) return;

    fetchMore();
  }, [fetchMore, isPreview])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    if (owners && owners.length > 0) fetchAccounts(owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map(x => x.cosmosAddress));

  }, [owners]);

  return (<>
    {!isNonIndexedBalances && <>
      <InformationDisplayCard title="" inheritBg noBorder>
        <div className='primary-text flex-center flex-wrap full-width'>
          <InfiniteScroll
            dataLength={owners.length}
            next={() => {
              fetchMore(pagination.bookmark)
            }}
            className='flex-center flex-wrap full-width'
            hasMore={isPreview ? false : pagination.hasMore}
            loader={<div>
              <br />
              <Spin size={'large'} />
              <br />
              <br />
            </div>}

            scrollThreshold="200px"
            endMessage={null}
            style={{ width: '100%' }}
          >
            {owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
              return <BalanceCard key={idx} collectionId={collectionId} owner={owner} />
            })}
          </InfiniteScroll>

          {!pagination.hasMore && owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').length === 0 && <Empty //<= 2 because of Mint and Total always being there
            description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className='primary-text'
          />}
        </div >

      </InformationDisplayCard>
    </>}
  </>)
}

export function BalanceChecker({ collectionId, badgeId, setTab }: {
  collectionId: bigint;
  badgeId: bigint
  setTab?: (tab: string) => void;
}) {

  return (<>
    <InformationDisplayCard
      title="Balance Checker"
    >
      {
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
      }
    </InformationDisplayCard>
  </>)

}