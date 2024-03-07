import { BitBadgesCollection, getCurrentValueForTimeline } from 'bitbadgesjs-sdk';

export function getCurrentMetadata(collection: BitBadgesCollection<bigint>) {
  const collectionMetadata = getCurrentValueForTimeline(collection.collectionMetadataTimeline)?.collectionMetadata;
  const badgeMetadata = getCurrentValueForTimeline(collection.badgeMetadataTimeline)?.badgeMetadata ?? [];

  return {
    collectionMetadata,
    badgeMetadata
  };
}
