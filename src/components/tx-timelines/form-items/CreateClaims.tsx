import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DevMode } from '../../common/DevMode';

import { CollectionApprovalWithDetails, DistributionMethod, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { ApprovalSelect } from '../../transfers/ApprovalSelect';

export function CreateClaims({ setVisible, nonMintApproval, defaultApproval }: {
  setVisible: (visible: boolean) => void, nonMintApproval?: boolean,
  defaultApproval?: CollectionApprovalWithDetails<bigint>
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);
  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <ApprovalSelect
        defaultFromMapping={nonMintApproval ? getReservedAddressMapping("AllWithoutMint") : getReservedAddressMapping("Mint")}
        fromMappingLocked={!nonMintApproval}
        collectionId={NEW_COLLECTION_ID}
        hideTransferDisplay={true}
        setVisible={setVisible}
        defaultApproval={defaultApproval}
        distributionMethod={isOffChainBalances ? DistributionMethod.OffChainBalances : distributionMethod}
        setDistributionMethod={setDistributionMethod}
        showMintingOnlyFeatures={!nonMintApproval}
        approvalsToAdd={txTimelineContext.approvalsToAdd}
        setApprovalsToAdd={txTimelineContext.setApprovalsToAdd}
        startingApprovals={txTimelineContext.startingCollection?.collectionApprovals ?? []}
        approvalPermissions={txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []}
      />
    </div>
    <DevMode obj={txTimelineContext.approvalsToAdd} />
  </div >
}