import { UintRange } from "bitbadgesjs-proto";
import { GO_MAX_UINT_64 } from "./dates";

export function getBadgeIdsString(badgeIds: UintRange<bigint>[]) {
  return badgeIds.map(badgeId => {
    if (badgeId.start === badgeId.end) return badgeId.start.toString();

    if (badgeId.end >= GO_MAX_UINT_64) return `${badgeId.start} - Max`;

    return `${badgeId.start} - ${badgeId.end}`;
  }).join(", ")
}