import { BitBadgesCollection } from "bitbadgesjs-utils";

export const neverHasManager = (collection: BitBadgesCollection<bigint> | Readonly<BitBadgesCollection<bigint>>) => {
  return (collection.managerTimeline.length == 0 || collection.managerTimeline.every(x => !x.manager));
}