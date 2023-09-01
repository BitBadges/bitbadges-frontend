import { BitBadgesCollection, getCurrentValueForTimeline } from "bitbadgesjs-utils";

export function getCurrentMetadata(collection: BitBadgesCollection<bigint>) {
  const collectionMetadata = getCurrentValueForTimeline(collection.collectionMetadataTimeline)?.collectionMetadata;
  const badgeMetadata = getCurrentValueForTimeline(collection.badgeMetadataTimeline)?.badgeMetadata ?? []

  return {
    collectionMetadata,
    badgeMetadata
  };
}
