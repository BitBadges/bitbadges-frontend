import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitNewMintMsg } from "../form-items/SubmitMsgMintBadge";
import { BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from "../../../bitbadges-api/types";
import { SubmitMsgUpdateUris } from "../form-items/SubmitMsgUpdateUris";

export function UpdateUrisStepItem(
    collection: BitBadgeCollection,
    setCollection: (collection: BitBadgeCollection) => void,
    newCollectionMsg: MessageMsgNewCollection,
    addMethod: MetadataAddMethod,
) {
    return {
        title: 'Distribute Badges',
        description: '',
        node: <SubmitMsgUpdateUris
            collection={{
                ...collection,
                collectionUri: addMethod === MetadataAddMethod.UploadUrl ? newCollectionMsg.collectionUri : collection.collectionUri,
                badgeUri: addMethod === MetadataAddMethod.UploadUrl ? newCollectionMsg.badgeUri : collection.badgeUri,
            }}
            setCollection={setCollection}
            addMethod={addMethod}
        />,
    }
}