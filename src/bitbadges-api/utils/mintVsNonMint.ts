import { BitBadgesCollection, getNonMintApprovals as getNonMint, getMintApprovals as getMint } from 'bitbadgesjs-sdk';

export const getNonMintApprovals = (collection: BitBadgesCollection<bigint> | Readonly<BitBadgesCollection<bigint>>) => {
  return getNonMint(collection.collectionApprovals);
};

export const getMintApprovals = (collection: BitBadgesCollection<bigint> | Readonly<BitBadgesCollection<bigint>>) => {
  return getMint(collection.collectionApprovals);
};
