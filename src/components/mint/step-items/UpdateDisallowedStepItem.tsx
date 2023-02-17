import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitNewMintMsg } from "../form-items/SubmitMsgMintBadge";
import { BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from "../../../bitbadges-api/types";
import { SubmitMsgUpdateUris } from "../form-items/SubmitMsgUpdateUris";
import { SubmitMsgUpdateDisallowedTransfers } from "../form-items/SubmitMsgUpdateDisallowedTransfers";

export function UpdateDisallowedStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection
) {
    return {
        title: 'Distribute Badges',
        description: '',
        node: <SubmitMsgUpdateDisallowedTransfers
            collection={{
                ...collection,
            }}
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
        />,
    }
}