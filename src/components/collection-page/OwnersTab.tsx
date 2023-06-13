import { Empty, Spin } from 'antd';
import { BalanceInfo, Numberify, PaginationInfo, getBalanceForId } from 'bitbadgesjs-utils';
import { useEffect, useRef, useState } from 'react';
import { getOwnersForBadge } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getPageDetails } from '../../utils/pagination';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';

export function OwnersTab({ collectionId, badgeId }: {
  collectionId: bigint;
  badgeId: bigint
}) {
  const accounts = useAccountsContext();
  const chain = useChainContext();
  const accountsRef = useRef(accounts);
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const isPreview = collection?.collectionId === MSG_PREVIEW_ID;

  const [loaded, setLoaded] = useState(false);
  const [owners, setOwners] = useState<BalanceInfo<bigint>[]>([]);
  const [currPage, setCurrPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
    total: 0
  });

  const totalNumOwners = pagination.total ? Numberify(pagination.total) : 0;

  const PAGE_SIZE = 10;
  const minId = 1;
  const maxId = totalNumOwners;

  const currPageDetails = getPageDetails(currPage, PAGE_SIZE, minId, maxId);
  const pageStartId = currPageDetails.start;
  const pageEndId = currPageDetails.end;


  useEffect(() => {
    if (!collection) return;

    const accountsToFetch: string[] = [];
    for (let i = pageStartId - 1; i < pageEndId; i++) {
      accountsToFetch.push(collection.owners[i].cosmosAddress);
    }

    accountsRef.current.fetchAccounts(accountsToFetch);
    //Even though this depends on collection (context), it should be okay because collection should not change
  }, [pageStartId, pageEndId, currPage, collection]);

  //TODO: Handle bookmarking logic within context
  useEffect(() => {
    async function getOwners() {
      if (isPreview) {
        //Is preview
        setLoaded(true);
      }
      const ownersRes = await getOwnersForBadge(collectionId, badgeId, { bookmark: pagination.bookmark });
      const badgeOwners = ownersRes.owners;
      setOwners(badgeOwners);
      setPagination({
        ...ownersRes.pagination,
        total: pagination.total ? pagination.total : ownersRes.pagination.total
      })

      setLoaded(true);
    }
    getOwners();
  }, [collectionId, badgeId, pagination.bookmark, pagination.total, isPreview]);

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
                    addressOrUsername={chain.cosmosAddress}
                    fontSize={16}
                  />
                </div>
                <div style={{ fontSize: 16 }}>
                  x{`${getBalanceForId(badgeId, owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.balances || [])}`}
                </div>
              </div> : <BlockinDisplay hideLogo />
            }
            <hr />
          </div>

          <h2 className='primary-text'>All Owners</h2>
          <Pagination currPage={currPage} onChange={setCurrPage} total={totalNumOwners} pageSize={PAGE_SIZE} />

          {owners?.map((owner, idx) => {
            if (idx < pageStartId - 1 || idx > pageEndId - 1) {
              return <></>
            } else {
              return <div key={idx} className='flex-between primary-text full-width' style={{ padding: 10 }}>
                <AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={16} />
                <div style={{ fontSize: 16 }}>
                  x{`${getBalanceForId(badgeId, owner.balances)}`}
                </div>
              </div>
            }
          })}
          {totalNumOwners === 0 && <Empty
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
