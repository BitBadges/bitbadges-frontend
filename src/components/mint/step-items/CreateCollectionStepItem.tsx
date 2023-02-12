import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgNewCollection";
import { BadgeMetadata, ClaimItem, DistributionMethod, MetadataAddMethod } from "../../../bitbadges-api/types";

export function CreateCollectionStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    claimItems: ClaimItem[],
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadata[],
    distributionMethod: DistributionMethod,
) {
    return {
        title: 'Submit Transaction',
        description: '',
        node: <SubmitMsgNewCollection
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            addMethod={addMethod}
            claimItems={claimItems}
            collectionMetadata={collectionMetadata}
            individualBadgeMetadata={individualBadgeMetadata}
            distributionMethod={distributionMethod}
        />
    }
}