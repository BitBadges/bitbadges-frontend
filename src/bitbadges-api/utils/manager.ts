import { BitBadgesCollection, TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { getPermissionDetails } from "../../components/collection-page/PermissionsInfo";
import { isCompletelyForbidden } from "../../components/tx-timelines/step-items/CanUpdateOffChainBalancesStepItem";

export const neverHasManager = (collection: BitBadgesCollection<bigint> | Readonly<BitBadgesCollection<bigint>>) => {
  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateManager), TimedUpdatePermissionUsedFlags, false);
  const canNeverUpdate = isCompletelyForbidden(permissionDetails);

  return (collection.managerTimeline.length == 0 || collection.managerTimeline.every(x => !x.manager)) && canNeverUpdate;
}