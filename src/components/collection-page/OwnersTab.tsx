import { Empty, Spin, Typography } from 'antd';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import { BalanceInfo, Numberify, PaginationInfo, getBalancesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getOwnersForBadge } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BalanceOverview } from './BalancesInfo';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

export function OwnersTab({ collectionId, badgeId }: {
  collectionId: bigint;
  badgeId: bigint
}) {
  const accounts = useAccountsContext();
  const chain = useChainContext();

  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId)
  const isPreview = collection?.collectionId === NEW_COLLECTION_ID;

  const [loaded, setLoaded] = useState(false);
  const [owners, setOwners] = useState<BalanceInfo<bigint>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
    total: 0
  });

  const totalNumOwners = pagination.total ? Numberify(pagination.total) : 0;

  const fetchMore = async () => {
    if (isPreview) return;

    const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: pagination.bookmark });
    const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]
    setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx));
    setPagination({
      ...ownersRes.pagination,
      total: (ownersRes.pagination.total ?? 0) - 2,
    });
  }

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: ');
    if (isPreview ? false : pagination.hasMore) fetchMore();
  }, [])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    if (!collection) return;

    accounts.fetchAccounts(owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map(x => cosmosToEth(x.cosmosAddress)) ?? []);
    //Even though this depends on collection (context), it should be okay because collection should not change
  }, [collection, owners]);

  //TODO: Handle bookmarking logic within context
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch owners');
    async function getOwners() {
      if (isPreview) {
        //Is preview
        setLoaded(true);
        return;
      }
      const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: pagination.bookmark });
      const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]
      setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx));
      setPagination({
        ...ownersRes.pagination,
        total: (ownersRes.pagination.total ?? 0) - 2, //-2 because of Mint and Total always being there
      });

      setLoaded(true);
    }
    getOwners();
  }, []);

  return (
    <InformationDisplayCard
      title="Balances"
    >
      {loaded ?
        <div className='dark:text-white flex-center flex-column'>
          {chain.address && <div className='full-width'>


            <div className='flex'>
              <BalanceOverview
                collectionId={collectionId}
                badgeId={badgeId}
              />
            </div>
          </div>}

          <Typography.Text className='dark:text-white mt-10' style={{ fontSize: 20, fontWeight: 600 }}>All Owners</Typography.Text>
          {/* <Pagination currPage={currPage} onChange={setCurrPage} total={totalNumOwners} pageSize={PAGE_SIZE} /> */}
          <InfiniteScroll
            dataLength={owners.length}
            next={fetchMore}

            hasMore={isPreview ? false : pagination.hasMore}
            loader={<div>
              <br />
              <Spin size={'large'} />
            </div>}
            scrollThreshold="200px"
            endMessage={null}
            style={{ width: '100%', overflow: 'hidden' }}
          >
            {owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {

              return <TableRow
                key={idx}
                label={
                  <div>
                    <AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={16} />
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
            className='dark:text-white'
          />}
        </div>
        : <div>
          <br />
          <Spin size={'large'} />
          <br />
        </div>
      }
    </InformationDisplayCard>
  );
}
