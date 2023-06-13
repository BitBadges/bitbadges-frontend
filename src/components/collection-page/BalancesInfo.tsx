import { Empty } from 'antd';
import { UserBalance } from 'bitbadgesjs-proto';
import { useEffect, useRef, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import collection from '../../pages/mint/collection';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';


export function BalanceOverview({ collectionId }: {
  collectionId: bigint;
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);
  const isPreview = collectionId === MSG_PREVIEW_ID;

  const signedInAccount = accounts.getAccount(chain.cosmosAddress);

  const [currBalance, setCurrBalance] = useState<UserBalance<bigint>>();
  const [addressOrUsername, setAddressOrUsername] = useState<string>(signedInAccount?.username || signedInAccount?.address || '');

  useEffect(() => {
    setAddressOrUsername(chain.cosmosAddress);
  }, [chain]);

  const DELAY_MS = 500;

  useEffect(() => {
    async function refreshBalance() {
      try {
        const balance = await collectionsRef.current.fetchBalanceForUser(collectionId, addressOrUsername);
        setCurrBalance(balance);
        return;
      } catch (e) { }

      setCurrBalance({
        balances: [],
        approvals: []
      });
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
        currBalance && !isPreview && <div>
          <BalanceDisplay
            collectionId={collectionId}
            balance={currBalance}
          />
        </div>
      }
    </div>
  </div>
  );
}
