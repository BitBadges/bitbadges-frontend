import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { Balance, BitBadgeCollection, ClaimItemWithTrees, DistributionMethod } from "bitbadgesjs-utils";
import { CreateClaims } from "../form-items/CreateClaims";

export function CreateClaimsStepItem(
  collection: BitBadgeCollection,
  newCollectionMsg: MessageMsgNewCollection,
  setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
  distributionMethod: DistributionMethod,
  claimItems: ClaimItemWithTrees[],
  setClaimItems: (claimItems: ClaimItemWithTrees[]) => void,
  manualSend: boolean,
  balancesToDistribute?: Balance[],
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>
) {
  return {
    title: `${distributionMethod === DistributionMethod.Codes ? 'Generate Codes' : distributionMethod === DistributionMethod.Whitelist ? 'Whitelist' : 'Claims'}`,
    description: '',
    node: <CreateClaims
      collection={collection}
      newCollectionMsg={newCollectionMsg}
      setNewCollectionMsg={setNewCollectionMsg}
      distributionMethod={distributionMethod}
      claimItems={claimItems}
      setClaimItems={setClaimItems}
      balancesToDistribute={balancesToDistribute}
      manualSend={manualSend}
      updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
    />,
    disabled: claimItems.length == 0
  }
}