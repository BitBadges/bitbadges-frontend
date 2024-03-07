import { BitBadgesCollection, isAddressValid } from 'bitbadgesjs-sdk';

export const neverHasManager = (collection: BitBadgesCollection<bigint> | Readonly<BitBadgesCollection<bigint>>) => {
  return collection.managerTimeline.length == 0 || collection.managerTimeline.every((x) => !x.manager || !isAddressValid(x.manager));
};
