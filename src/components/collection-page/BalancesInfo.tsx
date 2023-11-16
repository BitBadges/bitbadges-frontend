import { Empty } from 'antd';
import { Balance } from 'bitbadgesjs-proto';
import { searchUintRangesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';


import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';



export function BalanceOverview({ collectionId, badgeId, hideSelect, defaultAddress }: {
  collectionId: bigint;
  badgeId?: bigint
  hideSelect?: boolean;
  defaultAddress?: string;
}) {
  const chain = useChainContext();


  const collection = useCollection(collectionId);

  const isPreview = collectionId === NEW_COLLECTION_ID;

  const signedInAccount = useAccount(chain.address);

  const [currBalances, setCurrBalances] = useState<Balance<bigint>[]>();
  const [addressOrUsername, setAddressOrUsername] = useState<string>(defaultAddress || signedInAccount?.username || signedInAccount?.address || '');
  const account = useAccount(addressOrUsername);

  const DELAY_MS = 500;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set curr balance');

    async function refreshBalance() {
      try {
        if (!account || !account.address) return;
        if (collectionId === NEW_COLLECTION_ID) return;

        //Check both collections and users for the balances
        const accountHasBalance = account?.collected.find(x => x.collectionId === collectionId);
        const collectionHasBalance = collection?.owners.find(x => x.cosmosAddress === account?.cosmosAddress);

        if (accountHasBalance) {
          setCurrBalances(accountHasBalance.balances);
          return;
        } else if (collectionHasBalance) {
          setCurrBalances(collectionHasBalance.balances);
          return;
        }

        const balance = await fetchBalanceForUser(collectionId, account.address);
        setCurrBalances(balance.balances);
        return;
      } catch (e) { }

      setCurrBalances([]);
    }

    const delayDebounceFn = setTimeout(async () => {
      refreshBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [collectionId, account, collection]);

  if (!collection) return <></>;

  return (<div className='full-width flex-column'>
    <div className='full-width flex-center flex-column'>
      {<>
        <AddressSelect defaultValue={addressOrUsername} onUserSelect={setAddressOrUsername} disabled={hideSelect} />
      </>}
    </div>
    <div
      className='primary-text flex-center full-width'
      style={{ marginTop: 16 }}
    >
      {isPreview && <>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className='primary-text'
          description={<span className='primary-text'>Not supported for previews.</span>}
        ></Empty>
      </>}
      {
        currBalances && !isPreview && <div>
          <BalanceDisplay
            collectionId={collectionId}
            balances={currBalances.map(x => {
              if (!badgeId) return x;

              const filteredBadgeIds = [];
              const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
              if (found) {
                filteredBadgeIds.push({ start: badgeId, end: badgeId });
              }

              return {
                ...x,
                badgeIds: filteredBadgeIds
              }
            })}
          />
        </div>
      }
    </div>
  </div>
  );
}
