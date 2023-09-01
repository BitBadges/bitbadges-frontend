import { Balance } from "bitbadgesjs-proto";
import { CollectionApprovedTransferWithDetails, DistributionMethod, TransferWithIncrements } from "bitbadgesjs-utils";
import { CreateClaims } from "../form-items/CreateClaims";

export function CreateClaimsStepItem(
  approvedTransfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[],
  setApprovedTransfers: (transfers: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]) => void,
  transfers: TransferWithIncrements<bigint>[],
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void,
  distributionMethod: DistributionMethod,
  existingCollectionId?: bigint,
) {
  return {
    title: `Distribution - ${distributionMethod}`,
    description: '',
    node: <CreateClaims
      approvedTransfersToAdd={approvedTransfers}
      setApprovedTransfersToAdd={setApprovedTransfers}
      distributionMethod={distributionMethod}
      transfers={transfers}
      setTransfers={setTransfers}
      existingCollectionId={existingCollectionId}
    />
  }
}