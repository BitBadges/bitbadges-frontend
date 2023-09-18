import { DistributionMethod } from "bitbadgesjs-utils";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { CreateClaims } from "../form-items/CreateClaims";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function CreateClaimsStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const updateCollectionApprovedTransfers = txTimelineContext.updateCollectionApprovedTransfers;
  const setUpdateCollectionApprovedTransfers = txTimelineContext.setUpdateCollectionApprovedTransfers;
  const approvedTransfers = txTimelineContext.approvedTransfersToAdd;
  const transfers = txTimelineContext.transfers;
  const distributionMethod = txTimelineContext.distributionMethod;


  const CreateClaimsComponent = <CreateClaims />

  return {
    title: `Distribution - ${distributionMethod}`,
    description: '',
    disabled: distributionMethod === DistributionMethod.OffChainBalances ? transfers.length === 0 : approvedTransfers.length === 0,
    node: distributionMethod === DistributionMethod.OffChainBalances ? CreateClaimsComponent :
      <UpdateSelectWrapper
        updateFlag={updateCollectionApprovedTransfers}
        setUpdateFlag={setUpdateCollectionApprovedTransfers}
        jsonPropertyPath='collectionApprovedTransfers'
        permissionName='canUpdateCollectionApprovedTransfers'
        disableJson
        disableUndo
        mintOnly
        node={CreateClaimsComponent}
      />
  }
}