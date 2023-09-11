import { Balance } from 'bitbadgesjs-proto';
import { CollectionApprovedTransferWithDetails, DistributionMethod, TransferWithIncrements } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { DevMode } from '../../common/DevMode';

import { useEffect } from 'react';
import { MSG_PREVIEW_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';

//TODO: Create claims - Select type (codes vs direct transfers vs whitelist vs anyone) dynamically instead of hardcoding to jusst one distributionMethod
//Also rename from CreateClaims to something more generic. Use this as 
export function CreateClaims({
  distributionMethod,
  transfers,
  setTransfers,
  approvedTransfersToAdd,
  setApprovedTransfersToAdd,
  existingCollectionId
}: {
  distributionMethod: DistributionMethod;
  transfers: TransferWithIncrements<bigint>[];
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void;
  approvedTransfersToAdd: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[];
  setApprovedTransfersToAdd: (transfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]) => void;
  existingCollectionId?: bigint;
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;


  //This is the main useEffect where we update the collection with the new approved transfers

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: create claims, approved transfers to add changed');
    if (!collection || distributionMethod === DistributionMethod.OffChainBalances) return;

    //Slot it right in the middle [existing "Mint", toAdd, non-"Mint"]
    // const existingFromMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
    //   ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint') : [];

    const existingNonMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
      ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId !== 'Mint') : [];


    collections.updateCollection({
      ...collection,
      collectionApprovedTransfersTimeline: [{
        collectionApprovedTransfers: [
          // ...existingFromMint, //We included in approvedTransfersToAdd 
          ...approvedTransfersToAdd, ...existingNonMint],
        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
      }]
    });
  }, [approvedTransfersToAdd, existingCollection, distributionMethod]);

  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalances = distributionMethod === DistributionMethod.OffChainBalances ?
    collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances || []
    : collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || [];

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