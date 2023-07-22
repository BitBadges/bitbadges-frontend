import { Balance, convertBalance } from 'bitbadgesjs-proto';
import { BigIntify, CollectionApprovedTransferWithDetails, DistributionMethod, TransferWithIncrements } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { DevMode } from '../../common/DevMode';
import { MSG_PREVIEW_ID } from '../TxTimeline';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';
import { useState } from 'react';

//TODO: Create approvedTransfersToAdd - Select type (codes vs direct transfers vs whitelist vs anyone) dynamically instead of hardcoding to jusst one distributionMethod
//Also rename from CreateClaims to something more generic. Use this as 
export function CreateClaims({
  distributionMethod,
  transfers,
  setTransfers,
  balancesToDistribute
}: {
  distributionMethod: DistributionMethod;
  transfers: TransferWithIncrements<bigint>[];
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void;
  balancesToDistribute?: Balance<bigint>[];
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [approvedTransfersToAdd, setApprovedTransfersToAdd] = useState<(CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]>([]);

  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalances = balancesToDistribute ? balancesToDistribute.map(x => convertBalance(x, BigIntify)) : collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || [];

  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <div className='flex-center'>
        <ClaimSelect
          approvedTransfersToAdd={approvedTransfersToAdd}
          setApprovedTransfersToAdd={setApprovedTransfersToAdd}
          transfers={transfers}
          setTransfers={setTransfers}
          originalSenderBalances={originalSenderBalances}
          distributionMethod={distributionMethod}
          sender={'Mint'}
          collectionId={MSG_PREVIEW_ID}
          hideTransferDisplay={true}
          plusButton
        />
      </div>
    </div>
    <DevMode obj={approvedTransfersToAdd} />
  </div>
}