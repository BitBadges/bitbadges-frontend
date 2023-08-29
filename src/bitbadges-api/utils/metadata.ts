import { BadgeMetadata } from "bitbadgesjs-proto";
import { BitBadgesCollection, getCurrentIdxForTimeline } from "bitbadgesjs-utils";

export function getCurrentMetadata(collection: BitBadgesCollection<bigint>) {
  const collectionMetadataIdx = getCurrentIdxForTimeline(collection.collectionMetadataTimeline);
  let collectionMetadata = undefined;
  if (collectionMetadataIdx >= 0n) {
    collectionMetadata = collection.collectionMetadataTimeline[Number(collectionMetadataIdx)].collectionMetadata;
  }

  const badgeMetadataIdx = getCurrentIdxForTimeline(collection.badgeMetadataTimeline);
  let badgeMetadata: BadgeMetadata<bigint>[] = [];
  if (badgeMetadataIdx >= 0n) {
    badgeMetadata = collection.badgeMetadataTimeline[Number(badgeMetadataIdx)].badgeMetadata;
  }

  return {
    collectionMetadata,
    badgeMetadata
  };
}
