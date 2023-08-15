import { Empty } from 'antd';
import { Balance } from 'bitbadgesjs-proto';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';


export function BalanceOverview({ collectionId }: {
  collectionId: bigint;
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[`${collectionId}`];

  const isPreview = collectionId === MSG_PREVIEW_ID;

  const signedInAccount = accounts.getAccount(chain.address);

  const [currBalances, setCurrBalances] = useState<Balance<bigint>[]>();
  const [addressOrUsername, setAddressOrUsername] = useState<string>(signedInAccount?.username || signedInAccount?.address || '');
  // const [lastFetchedAt, setLastFetchedAt] = useState<bigint>(0n);

  const DELAY_MS = 500;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set curr balance');

    async function refreshBalance() {
      try {
        if (!addressOrUsername) return;

        //Check both collections and users for the balances
        const account = accounts.getAccount(addressOrUsername);
        const accountHasBalance = account?.collected.find(x => x.collectionId === collectionId);
        const collectionHasBalance = collection?.owners.find(x => x.cosmosAddress === account?.cosmosAddress);

        if (accountHasBalance) {
          setCurrBalances(accountHasBalance.balances);
          // setLastFetchedAt(accountHasBalance.fetchedAt ?? 0n);
          return;
        } else if (collectionHasBalance) {
          setCurrBalances(collectionHasBalance.balances);
          // setLastFetchedAt(collectionHasBalance.fetchedAt ?? 0n);
          return;
        }

        const balance = await collections.fetchBalanceForUser(collectionId, addressOrUsername);
        setCurrBalances(balance.balances);
        // setLastFetchedAt(balance.fetchedAt ?? 0n);
        return;
      } catch (e) { }

      setCurrBalances([]);
    }

    const delayDebounceFn = setTimeout(async () => {
      refreshBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [addressOrUsername, collectionId]);

  if (!collection) return <></>;

  return (<div className='full-width flex-column'>
    <div className='full-width flex-center flex-column'>
      <AddressSelect defaultValue={addressOrUsername} onUserSelect={setAddressOrUsername} />
      <br />

      <div className='flex-center'>
        <AddressDisplay addressOrUsername={addressOrUsername} />
      </div>
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
            balances={currBalances}
          />
        </div>
      }
    </div>
  </div>
  );
}
