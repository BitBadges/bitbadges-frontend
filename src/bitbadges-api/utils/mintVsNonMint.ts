import { BitBadgesCollection, getNonMintApprovals as getNonMint, getMintApprovals as getMint } from "bitbadgesjs-utils";

export const getNonMintApprovals = (collection: BitBadgesCollection<bigint>) => {
  return getNonMint(collection.collectionApprovals);
}

export const getMintApprovals = (collection: BitBadgesCollection<bigint>) => {
  return getMint(collection.collectionApprovals);
}