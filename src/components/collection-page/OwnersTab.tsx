import { Empty, Spin } from 'antd';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import { BalanceInfo, Numberify, PaginationInfo, getBalancesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getOwnersForBadge } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { BalanceOverview } from './BalancesInfo';

export function OwnersTab({ collectionId, badgeId }: {
  collectionId: bigint;
  badgeId: bigint
}) {
  const accounts = useAccountsContext();
  const chain = useChainContext();

  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const isPreview = collection?.collectionId === MSG_PREVIEW_ID;

  const [loaded, setLoaded] = useState(false);
  const [owners, setOwners] = useState<BalanceInfo<bigint>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
    total: 0
  });

  const totalNumOwners = pagination.total ? Numberify(pagination.total) : 0;



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    if (!collection) return;

    // const accountsToFetch: string[] = [...owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').slice(pageStartId - 1, pageEndId).map(x => cosmosToEth(x.cosmosAddress))];  //Default to ETH address if not found
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
        total: (ownersRes.pagination.total ?? 0) - 2,
      }
      );

      setLoaded(true);
    }
    getOwners();
  }, []);

  const isMobile = window.innerWidth < 768;
  return (
    <InformationDisplayCard
      title="Balances"
    >
      {loaded ?
        <div className='primary-text flex-center flex-column'>
          {chain.address && <div className='full-width'>


            <div className='flex'>
              <BalanceOverview
                collectionId={collectionId}
                badgeId={badgeId}
              />
            </div>
            <hr />
          </div>}

          <h2 className='primary-text'>All Owners</h2>
          {/* <Pagination currPage={currPage} onChange={setCurrPage} total={totalNumOwners} pageSize={PAGE_SIZE} /> */}
          <InfiniteScroll
            dataLength={owners.length}
            next={async () => {
              const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: pagination.bookmark });


              const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]

              setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx));
              setPagination({
                ...ownersRes.pagination,
                total: (ownersRes.pagination.total ?? 0) - 2,
              });
            }}

            hasMore={owners.length !== totalNumOwners}
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
                  <div style={{ float: isMobile ? undefined : 'left' }}>
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
            className='primary-text'
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
