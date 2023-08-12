import { UintRange } from "bitbadgesjs-proto";
import { FOREVER_DATE } from "./dates";

export function getBadgeIdsString(badgeIds: UintRange<bigint>[]) {
  return badgeIds.map(badgeId => {
    if (badgeId.start === badgeId.end) return badgeId.start.toString();

    if (badgeId.end >= FOREVER_DATE) return `${badgeId.start}-Max`;

    return `${badgeId.start}-${badgeId.end}`;
  }).join(", ")
}