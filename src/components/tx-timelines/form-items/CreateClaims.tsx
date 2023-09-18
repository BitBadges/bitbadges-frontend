import { DistributionMethod } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { DevMode } from '../../common/DevMode';

import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';

//TODO: Create claims - Select type (codes vs direct transfers vs whitelist vs anyone) dynamically instead of hardcoding to jusst one distributionMethod
export function CreateClaims() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const approvedTransfersToAdd = txTimelineContext.approvedTransfersToAdd;
  const setApprovedTransfersToAdd = txTimelineContext.setApprovedTransfersToAdd;
  const transfers = txTimelineContext.transfers;
  const setTransfers = txTimelineContext.setTransfers;


  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalances = txTimelineContext.distributionMethod === DistributionMethod.OffChainBalances ?
    collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances || []
    : collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || [];

  //TODO: Make this more dynamic
  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <ClaimSelect
        originalSenderBalances={originalSenderBalances}
        sender={'Mint'}
        collectionId={MSG_PREVIEW_ID}
        hideTransferDisplay={true}
        plusButton
        distributionMethod={txTimelineContext.distributionMethod}
        approvedTransfersToAdd={approvedTransfersToAdd}
        setApprovedTransfersToAdd={setApprovedTransfersToAdd}
        transfers={transfers}
        setTransfers={setTransfers}
      />
    </div>
    <DevMode obj={txTimelineContext.approvedTransfersToAdd} />
  </div>
}