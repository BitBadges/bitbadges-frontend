import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BitBadgeCollection, MetadataAddMethod } from "../../../bitbadges-api/types";
import { SubmitMsgUpdateUris } from "../form-items/SubmitMsgUpdateUris";

export function UpdateUrisStepItem(
    collection: BitBadgeCollection,
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    collectionMetadata: BadgeMetadata,
    badgeMetadata: { [key: string]: BadgeMetadata },
) {
    return {
        title: 'Distribute Badges',
        description: '',
        node: <SubmitMsgUpdateUris
            collectionMetadata={collectionMetadata}
            badgeMetadata={badgeMetadata}
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            addMethod={addMethod}
            collectionId={collection.collectionId}
        />,
    }
}