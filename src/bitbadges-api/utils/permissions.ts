import { ActionPermission, AddressMapping, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesCollection, CollectionApprovalPermissionWithDetails, GetFirstMatchOnly, GetMappingWithOptions, GetUintRangesWithOptions, UniversalPermissionDetails, getReservedAddressMapping, removeUintRangeFromUintRange } from "bitbadgesjs-utils";
import { PermissionNameString } from "../../components/collection-page/PermissionsInfo";
import { getPermissionVariablesFromName } from "../../components/tx-timelines/form-items/BeforeAfterPermission";
import { GO_MAX_UINT_64 } from "../../utils/dates";
export type GenericCollectionPermissionWithDetails = ActionPermission<bigint> | TimedUpdatePermission<bigint> | BalancesActionPermission<bigint> | TimedUpdateWithBadgeIdsPermission<bigint> | CollectionApprovalPermissionWithDetails<bigint>

export interface CleanedPermissionDetails {
  timelineTimes?: UintRange<bigint>[],
  badgeIds?: UintRange<bigint>[],
  ownershipTimes?: UintRange<bigint>[],
  transferTimes?: UintRange<bigint>[],
  toMapping?: AddressMapping,
  fromMapping?: AddressMapping,
  initiatedByMapping?: AddressMapping,
  amountTrackerIdMapping?: AddressMapping,
  challengeTrackerIdMapping?: AddressMapping,
  forbidden: boolean,
  permitted: boolean,
  permissionTimes: UintRange<bigint>[],
  neutralTimes: UintRange<bigint>[],
  permittedTimes: UintRange<bigint>[],
  forbiddenTimes: UintRange<bigint>[],
}

export function getDetailsForCollectionPermission(collection: BitBadgesCollection<bigint> | undefined, permissionName: PermissionNameString, badgeIds?: UintRange<bigint>[]) {
  const permissions = collection?.collectionPermissions[permissionName as keyof typeof collection.collectionPermissions] ?? [];
  return getDetailsForPermission(permissions, permissionName, badgeIds);
}

export function getDetailsForPermission(
  _permissions: GenericCollectionPermissionWithDetails[],
  permissionName: PermissionNameString,
  badgeIds?: UintRange<bigint>[],
  doNotMerge?: boolean
) {
  const { flags, castFunction } = getPermissionVariablesFromName(permissionName);
  const usedFlags = flags;
  const permissions = castFunction(_permissions);

  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToMapping, usesFromMapping, usesInitiatedByMapping, usesOwnershipTimes, usesAmountTrackerIdMapping, usesChallengeTrackerIdMapping } = usedFlags;
  const hideIfFull = true;
  let columns = [{
    title: 'Allowed?',
    dataIndex: 'permission',
    key: 'permission',
  },
  {
    title: 'Frozen?',
    dataIndex: 'frozen',
    key: 'frozen',
  },
  {
    title: 'Times',
    dataIndex: 'permissionTimes',
    key: 'permissionTimes'
  }];

  const dataSource: CleanedPermissionDetails[] = [];

  if (usesFromMapping) {
    columns.push({
      title: 'From',
      dataIndex: 'fromMapping',
      key: 'fromMapping',
    })
  }

  if (usesToMapping) {
    columns.push({
      title: 'To',
      dataIndex: 'toMapping',
      key: 'toMapping'
    })
  }

  if (usesInitiatedByMapping) {
    columns.push({
      title: 'Initiated By',
      dataIndex: 'initiatedByMapping',
      key: 'initiatedByMapping',
    })
  }

  if (usesTimelineTimes) {
    columns.push({
      title: 'Updatable Times',
      dataIndex: 'timelineTimes',
      key: 'timelineTimes'
    })
  }

  if (usesBadgeIds) {
    columns.push({
      title: 'Badge IDs',
      dataIndex: 'badgeIds',
      key: 'badgeIds',
    })
  }

  if (usesOwnershipTimes) {
    const isBalancesAction = usedFlags.usesBadgeIds && usedFlags.usesOwnershipTimes && !usedFlags.usesTimelineTimes;
    columns.push({
      title: isBalancesAction ? 'Circulating Times' : 'Ownership Times',
      dataIndex: 'ownershipTimes',
      key: 'ownershipTimes',
    })
  }

  if (usesTransferTimes) {
    columns.push({
      title: 'Transfer Times',
      dataIndex: 'transferTimes',
      key: 'transferTimes',
    })
  }



  if (usesAmountTrackerIdMapping) {
    columns.push({
      title: 'Amount Tracker ID',
      dataIndex: 'amountTrackerId',
      key: 'amountTrackerIdMapping',
    })
  }

  if (usesChallengeTrackerIdMapping) {
    columns.push({
      title: 'Challenge Tracker ID',
      dataIndex: 'challengeTrackerId',
      key: 'challengeTrackerIdMapping',
    })
  }


  let hasNeutralTimes = false;
  let hasPermittedTimes = false;
  let hasForbiddenTimes = false;
  let firstMatchDetails;
  if (doNotMerge) {
    firstMatchDetails = [];
    const defaultPerm = {
      timelineTimes: [{ start: 1n, end: 18446744073709551615n }],
      fromMapping: getReservedAddressMapping("All") as AddressMapping,
      toMapping: getReservedAddressMapping("All") as AddressMapping,
      initiatedByMapping: getReservedAddressMapping("All") as AddressMapping,
      amountTrackerIdMapping: getReservedAddressMapping("All") as AddressMapping,
      challengeTrackerIdMapping: getReservedAddressMapping("All") as AddressMapping,
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],

      permittedTimes: [],
      forbiddenTimes: [],

      ...usedFlags,

      arbitraryValue: {},
    }

    for (const permission of deepCopy([...permissions, defaultPerm])) {
      const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
      const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
      const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
      const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
      const permittedTimes = GetUintRangesWithOptions(permission.permittedTimes, true);
      const forbiddenTimes = GetUintRangesWithOptions(permission.forbiddenTimes, true);
      const arbitraryValue = permission.arbitraryValue;

      const toMapping = GetMappingWithOptions(permission.toMapping, permission.usesToMapping);
      const fromMapping = GetMappingWithOptions(permission.fromMapping, permission.usesFromMapping);
      const initiatedByMapping = GetMappingWithOptions(permission.initiatedByMapping, permission.usesInitiatedByMapping);
      const amountTrackerIdMapping = GetMappingWithOptions(permission.amountTrackerIdMapping, permission.usesAmountTrackerIdMapping);
      const challengeTrackerIdMapping = GetMappingWithOptions(permission.challengeTrackerIdMapping, permission.usesChallengeTrackerIdMapping);


      for (const badgeId of badgeIds) {
        for (const timelineTime of timelineTimes) {
          for (const transferTime of transferTimes) {
            for (const ownershipTime of ownershipTimes) {
              const brokenDown: UniversalPermissionDetails[] = [{
                badgeId: badgeId,
                timelineTime: timelineTime,
                transferTime: transferTime,
                ownershipTime: ownershipTime,
                toMapping: toMapping,
                fromMapping: fromMapping,
                initiatedByMapping: initiatedByMapping,
                amountTrackerIdMapping: amountTrackerIdMapping,
                challengeTrackerIdMapping: challengeTrackerIdMapping,

                permittedTimes: permittedTimes,
                forbiddenTimes: forbiddenTimes,

                arbitraryValue,
              }];


              for (const broken of brokenDown) {
                firstMatchDetails.push(broken);
              }
            }
          }
        }

      }
    }
  } else {
    firstMatchDetails = GetFirstMatchOnly(deepCopy(permissions), true, usedFlags);
  }

  //Neutral times = not explicitly permitted and not explicitly forbidden
  for (const origMatch of firstMatchDetails) {
    let neutralTimeRanges = [{ start: 1n, end: GO_MAX_UINT_64 }];

    let filteredDetails: UniversalPermissionDetails[] = [origMatch];
    if (badgeIds && usesBadgeIds) {
      filteredDetails = [];
      const [, removed] = removeUintRangeFromUintRange(badgeIds, [origMatch.badgeId] ?? []);
      for (const removedBadgeId of removed) {
        filteredDetails.push({
          ...origMatch,
          badgeId: removedBadgeId
        })
      }
    }

    for (const match of filteredDetails) {


      const [remaining, _] = removeUintRangeFromUintRange(match.forbiddenTimes, neutralTimeRanges)
      neutralTimeRanges = remaining;

      const [remaining2, _x] = removeUintRangeFromUintRange(match.permittedTimes, neutralTimeRanges)
      neutralTimeRanges = remaining2;

      if (neutralTimeRanges.length > 0) hasNeutralTimes = true;
      if (match.permittedTimes.length > 0) hasPermittedTimes = true;
      if (match.forbiddenTimes.length > 0) hasForbiddenTimes = true;

      const base = {
        timelineTimes: usesTimelineTimes ? [match.timelineTime] : undefined,
        badgeIds: usesBadgeIds ? [match.badgeId] : undefined,
        ownershipTimes: usesOwnershipTimes ? [match.ownershipTime] : undefined,
        transferTimes: usesTransferTimes ? [match.transferTime] : undefined,
        toMapping: usesToMapping ? match.toMapping : undefined,
        fromMapping: usesFromMapping ? match.fromMapping : undefined,
        initiatedByMapping: usesInitiatedByMapping ? match.initiatedByMapping : undefined,
        amountTrackerIdMapping: usesAmountTrackerIdMapping ? match.amountTrackerIdMapping : undefined,
        challengeTrackerIdMapping: usesChallengeTrackerIdMapping ? match.challengeTrackerIdMapping : undefined,
      }

      if (neutralTimeRanges.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: false,
          permissionTimes: neutralTimeRanges,
          ...base,
          neutralTimes: neutralTimeRanges,
          permittedTimes: [],
          forbiddenTimes: []
        })
      }

      if (match.permittedTimes.length > 0) {
        dataSource.push({
          permitted: true,
          forbidden: false,
          permissionTimes: match.permittedTimes,
          ...base,
          permittedTimes: match.permittedTimes,
          forbiddenTimes: [],
          neutralTimes: []
        })
      }

      if (match.forbiddenTimes.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: true,
          permissionTimes: match.forbiddenTimes,
          ...base,
          forbiddenTimes: match.forbiddenTimes,
          permittedTimes: [],
          neutralTimes: []
        })
      }
    }
  }


  //If anything is "All" or full, just don't show it
  //Isn't worth confusing the average user
  if (hideIfFull) {
    for (const column of columns) {
      if ((column.key.endsWith('Times') || column.key.endsWith('Ids')) && column.key !== 'permissionTimes') {
        const key = column.key as keyof typeof dataSource[0];
        let allAreFull = true;
        for (const x of dataSource) {
          const val = x[key] as any
          if (!(val?.length === 1 && val[0].start === 1n && val[0].end === GO_MAX_UINT_64)) {
            allAreFull = false;
          }
        }

        if (allAreFull) {
          columns = columns.filter(x => x.key !== column.key);
        }

      } else if (column.key.endsWith('Mapping') || column.key.endsWith('Id')) {
        let key = column.key as keyof typeof dataSource[0];
        if (column.key.endsWith('Id')) key = key + 'Mapping' as keyof typeof dataSource[0];
        let allAreFull = true;
        for (const x of dataSource) {
          const val = x[key] as any
          if (!(val?.addresses?.length === 0 && val.includeAddresses === false)) {
            allAreFull = false;
          }
        }

        if (allAreFull) {
          columns = columns.filter(x => x.key !== column.key);
        }
      }
    }
  }


  const isAlwaysFrozenAndForbidden: boolean = !hasNeutralTimes && !hasPermittedTimes;
  const isAlwaysPermittedOrNeutral: boolean = (hasNeutralTimes && !hasPermittedTimes && !hasForbiddenTimes) || (hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes)
  const isAlwaysFrozenAndPermitted: boolean = !hasNeutralTimes && !hasForbiddenTimes;
  const isCustom = !isAlwaysFrozenAndForbidden && !isAlwaysPermittedOrNeutral && !isAlwaysFrozenAndPermitted;

  return {
    columns,
    dataSource,
    hasPermittedTimes,
    hasNeutralTimes,
    hasForbiddenTimes,
    isAlwaysFrozenAndForbidden,
    isAlwaysPermittedOrNeutral,
    isAlwaysFrozenAndPermitted,
    isCustom,
    isAlwaysFrozen: !hasNeutralTimes,
  }
}

