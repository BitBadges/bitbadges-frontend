import { BitBadgeCollection } from "bitbadgesjs-utils";
import CollectionPage from "../../../pages/collections/[collectionId]";

export function PreviewCollectionStepItem(collection: BitBadgeCollection,
  // updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>
) {
  return {
    title: 'Collection Preview',
    description: `Please confirm all collection details are correct. Below is a preview of what the collection page will look like.`,
    node: <div>
      <CollectionPage collectionPreview={collection}
      // updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
      />
    </div>
  }
}