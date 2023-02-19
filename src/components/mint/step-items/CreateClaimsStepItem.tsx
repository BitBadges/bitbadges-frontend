import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, Balance, BitBadgeCollection, ClaimItem, DistributionMethod } from "../../../bitbadges-api/types";
import { CreateClaims } from "../form-items/CreateClaims";

export function CreateClaimsStepItem(
    collection: BitBadgeCollection,
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    distributionMethod: DistributionMethod,
    claimItems: ClaimItem[],
    setClaimItems: (claimItems: ClaimItem[]) => void,
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata },
    collectionMetadata: BadgeMetadata,
    balancesToDistribute?: Balance[],
) {
    return {
        title: `Create Claims`,
        description: '',
        node: <CreateClaims
            collection={collection}
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            distributionMethod={distributionMethod}
            claimItems={claimItems}
            setClaimItems={setClaimItems}
            individualBadgeMetadata={individualBadgeMetadata}
            collectionMetadata={collectionMetadata}
            balancesToDistribute={balancesToDistribute}
        />,
        disabled: claimItems.length == 0
    }
}