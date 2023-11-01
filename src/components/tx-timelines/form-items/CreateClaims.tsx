
import { DevMode } from '../../common/DevMode';

import { CollectionApprovalWithDetails, DistributionMethod, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { ApprovalSelect } from '../../transfers/ApprovalSelect';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';

export function CreateClaims({ setVisible, nonMintApproval, defaultApproval }: {
  setVisible: (visible: boolean) => void, nonMintApproval?: boolean,
  defaultApproval?: CollectionApprovalWithDetails<bigint>
}) {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const approvalsToAdd = collection?.collectionApprovals ?? [];
  const setApprovalsToAdd = (approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionApprovals: approvalsToAdd
    })
  }
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
        approvalsToAdd={approvalsToAdd}
        setApprovalsToAdd={setApprovalsToAdd}
        startingApprovals={txTimelineContext.startingCollection?.collectionApprovals ?? []}
        approvalPermissions={txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []}
      />
    </div>
    <DevMode obj={approvalsToAdd} />
  </div >
}