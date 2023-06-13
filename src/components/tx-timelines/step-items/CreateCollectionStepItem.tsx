import { BadgeSupplyAndAmount } from "bitbadgesjs-proto";
import { ClaimInfoWithDetails, DistributionMethod, MetadataAddMethod, TransferWithIncrements } from "bitbadgesjs-utils";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgNewCollection";

export function CreateCollectionStepItem(
  claims: (ClaimInfoWithDetails<bigint> & { codes: string[], password: string })[],
  transfers: TransferWithIncrements<bigint>[],
  badgeSupplys: BadgeSupplyAndAmount<bigint>[],
  addMethod: MetadataAddMethod,
  distributionMethod: DistributionMethod,
) {
  return {
    title: 'Submit Transaction',
    description: '',
    node: <SubmitMsgNewCollection
      claims={claims}
      addMethod={addMethod}
      distributionMethod={distributionMethod}
      transfers={transfers}
      badgeSupplys={badgeSupplys}
    />
  }
}