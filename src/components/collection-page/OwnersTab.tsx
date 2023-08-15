import { Empty, Spin } from 'antd';
import { BalanceInfo, Numberify, PaginationInfo, getBalancesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getOwnersForBadge } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getPageDetails } from '../../utils/pagination';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { cosmosToEth } from 'bitbadgesjs-address-converter';

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
  const [currPage, setCurrPage] = useState<number>(1);
  const [toSubtract, setToSubtract] = useState<number>(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
    total: 0
  });

  const totalNumOwners = pagination.total ? Numberify(pagination.total) : 0;

  const PAGE_SIZE = 10;
  const minId = 1;
  const maxId = totalNumOwners - toSubtract;

  const currPageDetails = getPageDetails(currPage, PAGE_SIZE, minId, maxId);
  const pageStartId = currPageDetails.start;
  const pageEndId = currPageDetails.end;


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch accounts ');
    if (!collection) return;

    const accountsToFetch: string[] = [...owners.map(x => cosmosToEth(x.cosmosAddress))];  //Default to ETH address if not found
    accounts.fetchAccounts(accountsToFetch);
    //Even though this depends on collection (context), it should be okay because collection should not change
  }, [pageStartId, pageEndId, currPage, collection, owners]);

  //TODO: Handle bookmarking logic within context
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch owners');
    async function getOwners() {
      if (isPreview) {
        //Is preview
        setLoaded(true);
      }
      const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: pagination.bookmark });


      const badgeOwners = [...ownersRes.owners.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total')]
      let toSubtract = 0;
      if (ownersRes.owners.find(x => x.cosmosAddress === 'Mint')) {
        toSubtract++;
      }
      if (ownersRes.owners.find(x => x.cosmosAddress === 'Total')) {
        toSubtract++;
      }
      setToSubtract(toSubtract);
      setOwners(owners => [...owners, ...badgeOwners].filter((x, idx, self) => self.findIndex(y => y.cosmosAddress === x.cosmosAddress) === idx));
      setPagination(x => {
        return {
          ...ownersRes.pagination,
          total: (x.total ?? 0) + badgeOwners.length
        }
      });

      setLoaded(true);
    }
    getOwners();
  }, [collectionId, badgeId, pagination.bookmark, pagination.total, isPreview]);

  const currUserBalance = owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.balances ?? [];
  return (
    <InformationDisplayCard
      title="Balances"
    >
      {loaded ?
        <div className='primary-text flex-center flex-column'>
          <div className='full-width'>
            <h2 className='primary-text'>You</h2>
            {chain.connected && chain.cosmosAddress ?
              <div className='flex-between primary-text full-width' style={{ padding: 10 }}>
                <div>
                  <AddressDisplay
                    addressOrUsername={chain.address}
                    fontSize={16}
                  />
                </div>
                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    hideBadges
                    floatToRight
                    collectionId={collectionId}
                    showingSupplyPreview
                    hideMessage
                    balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, currUserBalance) : currUserBalance}
                  />
                  <br />
                </div>
              </div> : <BlockinDisplay hideLogo />
            }
            <hr />
          </div>

          <h2 className='primary-text'>All Owners</h2>
          <Pagination currPage={currPage} onChange={setCurrPage} total={totalNumOwners} pageSize={PAGE_SIZE} />

          {owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
            console.log("OWNERS", owners);
            if (idx < pageStartId - 1 || idx > pageEndId - 1) {
              return <></>
            } else {
              return <div key={idx} className='flex-between primary-text full-width' style={{ padding: 10 }}>
                <AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={16} />
                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    hideBadges
                    floatToRight
                    collectionId={collectionId}
                    showingSupplyPreview
                    hideMessage
                    balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, owner.balances) : owner.balances}
                  />
                  <br />
                </div>
              </div>
            }
          })}
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
