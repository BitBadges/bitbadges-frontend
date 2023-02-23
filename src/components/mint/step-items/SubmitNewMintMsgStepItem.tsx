import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitNewMintMsg } from "../form-items/SubmitMsgMintBadge";
import { BadgeMetadata, BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from "../../../bitbadges-api/types";

export function SubmitNewMintMsgStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata },

    claimItems: ClaimItem[],
    setClaimItems: (claimItems: ClaimItem[]) => void,
    distributionMethod: DistributionMethod,
    manualSend: boolean,
    addMethod: MetadataAddMethod,
    updateMetadata: boolean
) {
    return {
        title: 'Distribute Badges',
        description: '',
        node: <SubmitNewMintMsg
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            collection={collection}
            claimItems={claimItems}
            distributionMethod={distributionMethod}
            setClaimItems={setClaimItems}
            manualSend={manualSend}
            collectionMetadata={collectionMetadata}
            individualBadgeMetadata={individualBadgeMetadata}
            addMethod={addMethod}
            updateMetadata={updateMetadata}
        />,
    }
}