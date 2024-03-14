import { Empty, Switch } from 'antd';
import { BalanceArray, getBalancesForId } from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';

export function BalanceOverview({
  collectionId,
  badgeId,
  hideSelect,
  defaultAddress
}: {
  collectionId: bigint;
  badgeId?: bigint;
  hideSelect?: boolean;
  defaultAddress?: string;
}) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);
  const signedInAccount = useAccount(chain.address);
  const isPreview = collectionId === NEW_COLLECTION_ID;

  const [addressOrUsername, setAddressOrUsername] = useState<string>(defaultAddress || signedInAccount?.username || signedInAccount?.address || '');
  const account = useAccount(addressOrUsername);

  const [lastFetchedBalances, setLastFetchedBalances] = useState<BalanceArray<bigint>>(new BalanceArray<bigint>());
  const isNonIndexedBalances = collection && collection.balancesType == 'Off-Chain - Non-Indexed' ? true : false;

  const [onlyShowBadge, setOnlyShowBadge] = useState<boolean>(!!badgeId);

  //If we are in non-indexed balances mode, we need to fetch balances manually for the user
  //If we are not, we will store it somewhere in the context (account or collection)
  const currBalances = useMemo(() => {
    if (!account?.address) return new BalanceArray<bigint>();
    if (collectionId === NEW_COLLECTION_ID) return new BalanceArray<bigint>();
    if (isNonIndexedBalances) return lastFetchedBalances;

    //Check both collections and users to see if we have anything cached
    const accountHasBalance = account?.collected.find((x) => x.collectionId === collectionId);
    const collectionHasBalance = collection?.owners.find((x) => x.cosmosAddress === account?.cosmosAddress);

    if (accountHasBalance) {
      return accountHasBalance.balances;
    } else if (collectionHasBalance) {
      return collectionHasBalance.balances;
    }

    return new BalanceArray<bigint>();
  }, [collectionId, account, collection, isNonIndexedBalances, lastFetchedBalances]);

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set curr balance');

    async function refreshBalance() {
      try {
        if (!account?.address) return;
        if (collectionId === NEW_COLLECTION_ID) return;

        if (!isNonIndexedBalances) {
          //Check both collections and users to see if we have anything cached
          const accountHasBalance = account?.collected.find((x) => x.collectionId === collectionId);
          const collectionHasBalance = collection?.owners.find((x) => x.cosmosAddress === account?.cosmosAddress);

          if (accountHasBalance || collectionHasBalance) return;
        }

        const balance = await fetchBalanceForUser(collectionId, account.address);
        setLastFetchedBalances(balance.balances);
      } catch (e) {
        console.log(e);
      }
    }

    const delayDebounceFn = setTimeout(async () => {
      refreshBalance();
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [collectionId, account, collection, isNonIndexedBalances]);

  if (!collection) return <></>;

  const balancesToShow = badgeId && currBalances && onlyShowBadge ? getBalancesForId(badgeId, currBalances) : currBalances;

  return (
    <div className="full-width flex-column">
      <div className="full-width flex-center flex-column">
        <AddressSelect addressOrUsername={addressOrUsername} onUserSelect={setAddressOrUsername} disabled={hideSelect} />
      </div>
      <div className="primary-text full-width" style={{ marginTop: 16 }}>
        {isPreview && (
          <>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="primary-text"
              description={<span className="primary-text">Not supported for previews.</span>}></Empty>
          </>
        )}
        {!!badgeId && !isPreview && (
          <>
            <Switch checked={onlyShowBadge} onChange={setOnlyShowBadge} checkedChildren={`Filter by ID ${badgeId}`} unCheckedChildren="All Badges" />
            <br /> <br />
          </>
        )}
        {currBalances && !isPreview && (
          <>
            <div>
              <BalanceDisplay hideMessage collectionId={collectionId} balances={balancesToShow} />
            </div>
            <br />
          </>
        )}
      </div>
    </div>
  );
}
