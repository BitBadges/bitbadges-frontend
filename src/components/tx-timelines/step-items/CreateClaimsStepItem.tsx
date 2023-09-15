import { Balance } from "bitbadgesjs-proto";
import { CollectionApprovedTransferWithDetails, DistributionMethod, TransferWithIncrements } from "bitbadgesjs-utils";
import { CreateClaims } from "../form-items/CreateClaims";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function CreateClaimsStepItem(
  approvedTransfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[],
  setApprovedTransfers: (transfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]) => void,
  transfers: TransferWithIncrements<bigint>[],
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void,
  distributionMethod: DistributionMethod,
  updateCollectionApprovedTransfers: boolean,
  setUpdateCollectionApprovedTransfers: (val: boolean) => void,

  existingCollectionId?: bigint,
) {
  const CreateClaimsComponent =
    <CreateClaims
      approvedTransfersToAdd={approvedTransfers}
      setApprovedTransfersToAdd={setApprovedTransfers}
      distributionMethod={distributionMethod}
      transfers={transfers}
      setTransfers={setTransfers}
      existingCollectionId={existingCollectionId}
    />
  return {
    title: `Distribution - ${distributionMethod}`,
    description: '',
    node: distributionMethod === DistributionMethod.OffChainBalances ? CreateClaimsComponent :
      <UpdateSelectWrapper
        updateFlag={updateCollectionApprovedTransfers}
        setUpdateFlag={setUpdateCollectionApprovedTransfers}
        existingCollectionId={existingCollectionId}
        jsonPropertyPath='collectionApprovedTransfersTimeline'
        permissionName='canUpdateCollectionApprovedTransfers'
        disableJson
        disableUndo
        mintOnly
        node={CreateClaimsComponent}
      />

  }
}