import { Balance, convertBalance } from 'bitbadgesjs-proto';
import { BigIntify, CollectionApprovedTransferWithDetails, DistributionMethod, TransferWithIncrements } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { DevMode } from '../../common/DevMode';
import { MSG_PREVIEW_ID } from '../TxTimeline';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';
import { useEffect } from 'react';
import { FOREVER_DATE } from '../../../utils/dates';
import { INFINITE_LOOP_MODE } from '../../../constants';

//TODO: Create claims - Select type (codes vs direct transfers vs whitelist vs anyone) dynamically instead of hardcoding to jusst one distributionMethod
//Also rename from CreateClaims to something more generic. Use this as 
export function CreateClaims({
  distributionMethod,
  transfers,
  setTransfers,
  approvedTransfersToAdd,
  setApprovedTransfersToAdd,
  existingCollectionId,
  balancesToDistribute
}: {
  distributionMethod: DistributionMethod;
  transfers: TransferWithIncrements<bigint>[];
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void;
  approvedTransfersToAdd: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[];
  setApprovedTransfersToAdd: (transfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]) => void;
  existingCollectionId?: bigint;
  balancesToDistribute?: Balance<bigint>[];
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: create claims, approved transfers to add changed');
    if (!collection || distributionMethod === DistributionMethod.OffChainBalances) return;

    //Slot it right in the middle of [existing from "Mint", toAdd, non-"Mint"]
    const existingFromMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
      ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint') : [];

    const existingNonMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
      ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId !== 'Mint') : [];


    collections.updateCollection({
      ...collection,
      collectionApprovedTransfersTimeline: [{
        collectionApprovedTransfers: [...existingFromMint, ...approvedTransfersToAdd, ...existingNonMint],
        timelineTimes: [{ start: 1n, end: FOREVER_DATE }]
      }]
    });

  }, [approvedTransfersToAdd, existingCollection, distributionMethod]);

  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalances = balancesToDistribute ? balancesToDistribute.map(x => convertBalance(x, BigIntify)) : collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || [];

  //TODO: Make this more dynamic


  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <div>
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