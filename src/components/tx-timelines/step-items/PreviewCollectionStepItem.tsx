import { BitBadgeCollection } from "../../../bitbadges-api/types";
import CollectionPage from "../../../pages/collections/[collectionId]";

export function PreviewCollectionStepItem(collection: BitBadgeCollection) {
    return {
        title: 'Collection Preview',
        description: `Please confirm all collection details are correct.`,
        node: <div>
            <CollectionPage collectionPreview={collection} />
        </div>
    }
}