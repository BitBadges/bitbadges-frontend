import { UintRange } from "bitbadgesjs-sdk";
import { GO_MAX_UINT_64 } from "./dates";

export function getBadgeIdsString(badgeIds: UintRange<bigint>[]) {
  if (badgeIds.length === 0) return "None";

  const str = badgeIds.map(badgeId => {
    if (badgeId.start === badgeId.end) return badgeId.start.toString();

    if (badgeId.end >= GO_MAX_UINT_64) {
      if (badgeId.start === 1n) return "All";
      return `${badgeId.start}-Max`;
    }
    return `${badgeId.start}-${badgeId.end}`;
  }).join(", ")

  return str;
}