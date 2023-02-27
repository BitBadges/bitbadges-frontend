import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, MetadataAddMethod } from "../../../bitbadges-api/types";
import { MetadataForm } from "../form-items/MetadataForm";

export function SetCollectionMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    collectionMetadata: BadgeMetadata,
    setCollectionMetadata: (metadata: BadgeMetadata) => void
) {
    return {
        title: 'Set the Collection Metadata',
        description: `Provide details about the badge collection.`,
        node: <MetadataForm
            addMethod={addMethod}
            metadata={collectionMetadata}
            setMetadata={setCollectionMetadata as any}
            setNewCollectionMsg={setNewCollectionMsg}
            newCollectionMsg={newCollectionMsg}
        />,
        disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
            || (addMethod === MetadataAddMethod.UploadUrl && (newCollectionMsg.badgeUri.indexOf('{id}') == -1))
            || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
    }
}