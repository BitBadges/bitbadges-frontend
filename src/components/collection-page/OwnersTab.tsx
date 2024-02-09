import { Empty, Spin, Tooltip, notification } from 'antd';
import { BalanceDoc, BitBadgesUserInfo, PaginationInfo } from 'bitbadgesjs-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getAccounts, getOwnersForBadge } from '../../bitbadges-api/api';

import { DownloadOutlined } from '@ant-design/icons';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts, getAccount, updateAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, fetchNextForCollectionViews, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { downloadJson } from '../../utils/downloadJson';
import { AddressDisplay } from '../address/AddressDisplay';
import { AccountDetailsTag, AccountFilterSearchBar } from '../badges/DisplayFilters';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { SelectWithOptions } from '../inputs/Selects';
import { BalanceOverview } from './BalancesInfo';


function BalanceInfiniteScroll({
  collectionId,
  cardView,
  setCardView,
  fetchMore,
  owners,
  pagination,
  showBadges,
  setShowBadges,
}: {
  collectionId: bigint;
  cardView: boolean;
  setCardView: (val: boolean) => void;
  fetchMore: () => Promise<void>;
  owners: BalanceDoc<bigint>[];
  pagination: PaginationInfo;
  showBadges: boolean;
  setShowBadges: (val: boolean) => void;
}) {
  const isPreview = collectionId === NEW_COLLECTION_ID;

  const [numShown, setNumShown] = useState(25);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchedBalanceDocs, setSearchedBalanceDocs] = useState<BalanceDoc<bigint>[]>([]);

  const [loading, setLoading] = useState(false);

  const toShow = owners.slice(0, numShown);

  return <>
    <div className='flex-between'>
      <div></div>
      <div
        className="flex-wrap full-width flex"
        style={{ flexDirection: "row-reverse", alignItems: "flex-end", marginTop: 12 }}
      >
        <SelectWithOptions
          title=''
          value={'Yes'}
          setValue={async () => {
            notification.info({
              message: 'Downloading the list of owners and their balances.',
              description: 'To do this, we need to fetch any missing values which may take awhile.'
            });
            setLoading(true);

            const hasMore = pagination.hasMore;
            while (hasMore) {
              await fetchMore();
              //wait 1 second
              await new Promise(r => setTimeout(r, 450));
            }

            const accountsToFetch = [];
            for (const cosmosAddress of owners.map(x => x.cosmosAddress).filter(x => x !== 'Mint' && x !== 'Total')) {
              const cachedAccount = getAccount(cosmosAddress);
              if (!cachedAccount) {
                accountsToFetch.push(cosmosAddress);
              }
            }

            const missingAccounts: BitBadgesUserInfo<bigint>[] = [];
            //Batch in groups of 25
            for (let i = 0; i < accountsToFetch.length; i += 25) {
              const accountsToFetchBatch = accountsToFetch.slice(i, i + 25);
              const res = await getAccounts({ accountsToFetch: accountsToFetchBatch.map(x => { return { address: x } }) });
              missingAccounts.push(...res.accounts);
              //wait 1 second
              await new Promise(r => setTimeout(r, 450));
            }

            const jsonToDownload = {


              owners: owners.map(x => {
                const cachedAccount = getAccount(x.cosmosAddress);
                return {
                  balances: x.balances,
                  collectionId: collectionId,
                  cosmosAddress: x.cosmosAddress,
                  address: cachedAccount ? cachedAccount.address : missingAccounts.find(y => y.cosmosAddress === x.cosmosAddress)?.address,
                }
              }).filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total'),
              addresses: owners.map(x => {
                const cachedAccount = getAccount(x.cosmosAddress);
                return cachedAccount ? cachedAccount.address : missingAccounts.find(y => y.cosmosAddress === x.cosmosAddress)?.address;
              }).filter(x => x !== 'Mint' && x !== 'Total'),
              cosmosAddresses: owners.map(x => x.cosmosAddress).filter(x => x !== 'Mint' && x !== 'Total'),
            }

            downloadJson(jsonToDownload, 'owners.json');

            updateAccounts(missingAccounts);

            setLoading(false);
          }}
          type='button'
          options={[{
            label: loading ? <Spin size='small' /> : <Tooltip title='Download the list of owners and their balances. We will need to fetch all balances, if missing.'><DownloadOutlined /></Tooltip>,
            value: 'Yes',
          }]}
        />
        <SelectWithOptions
          title='View'
          value={cardView ? 'Card' : 'Table'}
          setValue={val => {
            setCardView(val === 'Card');
          }}
          options={[{
            label: 'Card',
            value: 'Card',
          }, {
            label: 'Table',
            value: 'Table',
          }]}
        />
        <SelectWithOptions
          title='Images'
          value={showBadges ? 'Yes' : 'No'}
          setValue={val => {
            setShowBadges(val === 'Yes');
          }}
          options={[{
            label: 'Yes',
            value: 'Yes',
          }, {
            label: 'No',
            value: 'No',
          }]}
        />
        {(
          <div style={{ marginBottom: 4, flexGrow: 1 }}> {/* Add this style to make it grow */}
            <AccountFilterSearchBar
              searchValue={searchAddress}
              setSearchValue={setSearchAddress}
              onSearch={async (address: string) => {

                const res = await fetchBalanceForUser(collectionId, address);
                setSearchedBalanceDocs([...searchedBalanceDocs ?? [], res]);
                setSearchAddress('');
              }} />
          </div>
        )}
      </div>
    </div >
    <br />
    {searchedBalanceDocs.length > 0 && <div className='flex-center flex-wrap full-width'>
      {searchedBalanceDocs.map((owner, idx) => {
        return <AccountDetailsTag
          key={idx}
          addressOrUsername={owner.cosmosAddress} onClose={() => {
            setSearchedBalanceDocs(searchedBalanceDocs.filter(x => x.cosmosAddress !== owner.cosmosAddress));
            setSearchAddress('');
          }} />
      })}

    </div>}
    <br />
    <div className='primary-text flex-center flex-wrap full-width'>
      {searchedBalanceDocs.length > 0 && <>
        {searchedBalanceDocs.map((owner, idx) => {
          return <BalanceCard key={idx} collectionId={collectionId} owner={owner} hideBadges={!showBadges} />
        })}</>}


      {toShow.length > 0 && searchedBalanceDocs.length === 0 && <>
        <InfiniteScroll
          dataLength={toShow.length}
          next={() => {
            if (numShown + 25 >= owners.length) {

              fetchMore()
            }

            setNumShown(numShown + 25);


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
          {cardView ? <>
            {toShow?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
              return <BalanceCard key={idx} collectionId={collectionId} owner={owner} hideBadges={!showBadges} />
            })}</> : <>
            <div className='full-width flex-center'>
              <InformationDisplayCard md={12} xs={24} sm={24} title='Owners'>

                {toShow?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').map((owner, idx) => {
                  return <TableRow
                    key={idx}
                    label={<AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={24} />}
                    value={
                      <div style={{ float: "right" }}>
                        <BalanceDisplay
                          floatToRight
                          hideBadges={!showBadges}
                          collectionId={collectionId}
                          hideMessage
                          balances={owner.balances}
                        />
                      </div>
                    }
                    labelSpan={8}
                    valueSpan={16}
                  />
                })}
              </InformationDisplayCard>
            </div>
          </>}
        </InfiniteScroll>

      </>}
      {searchedBalanceDocs.length === 0 && !pagination.hasMore && owners?.filter(x => x.cosmosAddress !== 'Mint' && x.cosmosAddress !== 'Total').length === 0 && <Empty //<= 2 because of Mint and Total always being there
        description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className='primary-text'
      />}

    </div >
  </>
}


export function CollectionOwnersTab({ collectionId }: {
  collectionId: bigint;
}) {
  const collection = useCollection(collectionId)
  const isPreview = collection?.collectionId === NEW_COLLECTION_ID;
  const isNonIndexedBalances = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;
  const [cardView, setCardView] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
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

  return (<>
    {!isNonIndexedBalances && <>
      <InformationDisplayCard inheritBg noBorder>
        <BalanceInfiniteScroll
          collectionId={collectionId}
          cardView={cardView}
          setCardView={setCardView}
          showBadges={showBadges}
          setShowBadges={setShowBadges}
          fetchMore={async () => { fetchMore() }}
          owners={owners}
          pagination={collection?.views.owners?.pagination ?? { hasMore: true, bookmark: '' }}
        />
      </InformationDisplayCard>
    </>}
  </>)
}

export const BalanceCard = ({ collectionId, owner, fullWidth, hideBadges }: {
  collectionId: bigint;
  owner?: BalanceDoc<bigint>;
  fullWidth?: boolean;
  hideBadges?: boolean;
}) => {
  if (!owner) return <></>;

  return <InformationDisplayCard
    noBorder={fullWidth} inheritBg={fullWidth}
    md={fullWidth ? 24 : 8} xs={24} sm={24} title={<div className='flex-center'>
      <AddressDisplay addressOrUsername={owner.cosmosAddress} fontSize={20} />
    </div>}>
    <div className='primary-text flex-center flex-column'>
      <BalanceDisplay
        hideBadges={hideBadges}
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

  const [cardView, setCardView] = useState(true);
  const [showBadges, setShowBadges] = useState(true);

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
      <InformationDisplayCard inheritBg noBorder>

        <BalanceInfiniteScroll
          collectionId={collectionId}
          cardView={cardView}
          setCardView={setCardView}
          showBadges={showBadges}
          setShowBadges={setShowBadges}
          fetchMore={async () => { fetchMore(pagination.bookmark) }}
          owners={owners}
          pagination={pagination}
        />
      </InformationDisplayCard>
    </>}
  </>)
}

export function BalanceChecker({ collectionId, badgeId, setTab }: {
  collectionId: bigint;
  badgeId?: bigint
  setTab?: (tab: string) => void;
}) {

  return (
    <InformationDisplayCard
      title="Balance Checker"
    >
      <div className='primary-text flex-center flex-column full-width'>
        <BalanceOverview
          collectionId={collectionId}
          badgeId={badgeId}
          setTab={setTab}
        />
      </div>
    </InformationDisplayCard>
  )

}