import { ActionPermission, AddressList, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange, deepCopy } from "bitbadgesjs-sdk";
import { BitBadgesCollection, CollectionApprovalPermissionWithDetails, GetFirstMatchOnly, GetListWithOptions, GetUintRangesWithOptions, UniversalPermissionDetails, getReservedAddressList, removeUintRangesFromUintRanges } from "bitbadgesjs-sdk";
import { PermissionNameString } from "../../components/collection-page/PermissionsInfo";
import { getPermissionVariablesFromName } from "../../components/tx-timelines/form-items/BeforeAfterPermission";
import { GO_MAX_UINT_64 } from "../../utils/dates";
export type GenericCollectionPermissionWithDetails = ActionPermission<bigint> | TimedUpdatePermission<bigint> | BalancesActionPermission<bigint> | TimedUpdateWithBadgeIdsPermission<bigint> | CollectionApprovalPermissionWithDetails<bigint>

export interface CleanedPermissionDetails {
  timelineTimes: UintRange<bigint>[],
  badgeIds: UintRange<bigint>[],
  ownershipTimes: UintRange<bigint>[],
  transferTimes: UintRange<bigint>[],
  toList: AddressList,
  fromList: AddressList,
  initiatedByList: AddressList,
  approvalIdList: AddressList,
  amountTrackerIdList: AddressList,
  challengeTrackerIdList: AddressList,
  forbidden: boolean,
  permitted: boolean,
  permissionTimes: UintRange<bigint>[],
  neutralTimes: UintRange<bigint>[],
  permanentlyPermittedTimes: UintRange<bigint>[],
  permanentlyForbiddenTimes: UintRange<bigint>[],
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

  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToList, usesFromList, usesInitiatedByList, usesOwnershipTimes, usesApprovalIdList, usesAmountTrackerIdList, usesChallengeTrackerIdList } = usedFlags;
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

  if (usesFromList) {
    columns.push({
      title: 'From',
      dataIndex: 'fromList',
      key: 'fromList',
    })
  }

  if (usesToList) {
    columns.push({
      title: 'To',
      dataIndex: 'toList',
      key: 'toList'
    })
  }

  if (usesInitiatedByList) {
    columns.push({
      title: 'Initiated By',
      dataIndex: 'initiatedByList',
      key: 'initiatedByList',
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



  if (usesApprovalIdList) {
    columns.push({
      title: 'Approval ID',
      dataIndex: 'approvalId',
      key: 'approvalIdList',
    })
  }

  if (usesAmountTrackerIdList) {
    columns.push({
      title: 'Amount Tracker ID',
      dataIndex: 'amountTrackerId',
      key: 'amountTrackerIdList',
    })
  }

  if (usesChallengeTrackerIdList) {
    columns.push({
      title: 'Challenge Tracker ID',
      dataIndex: 'challengeTrackerId',
      key: 'challengeTrackerIdList',
    })
  }


  let hasNeutralTimes = false;
  let hasPermanentlyPermittedTimes = false;
  let hasPermanentlyForbiddenTimes = false;
  let firstMatchDetails;
  if (doNotMerge) {
    firstMatchDetails = [];
    const defaultPerm = {
      timelineTimes: [{ start: 1n, end: 18446744073709551615n }],
      fromList: getReservedAddressList("All") as AddressList,
      toList: getReservedAddressList("All") as AddressList,
      initiatedByList: getReservedAddressList("All") as AddressList,
      approvalIdList: getReservedAddressList("All") as AddressList,
      amountTrackerIdList: getReservedAddressList("All") as AddressList,
      challengeTrackerIdList: getReservedAddressList("All") as AddressList,
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],

      ...usedFlags,

      arbitraryValue: {},
    }

    for (const permission of deepCopy([...permissions, defaultPerm])) {
      const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
      const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
      const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
      const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
      const permanentlyPermittedTimes = GetUintRangesWithOptions(permission.permanentlyPermittedTimes, true);
      const permanentlyForbiddenTimes = GetUintRangesWithOptions(permission.permanentlyForbiddenTimes, true);
      const arbitraryValue = permission.arbitraryValue;

      const toList = GetListWithOptions(permission.toList, permission.usesToList);
      const fromList = GetListWithOptions(permission.fromList, permission.usesFromList);
      const initiatedByList = GetListWithOptions(permission.initiatedByList, permission.usesInitiatedByList);
      const approvalIdList = GetListWithOptions(permission.approvalIdList, permission.usesApprovalIdList);
      const amountTrackerIdList = GetListWithOptions(permission.amountTrackerIdList, permission.usesAmountTrackerIdList);
      const challengeTrackerIdList = GetListWithOptions(permission.challengeTrackerIdList, permission.usesChallengeTrackerIdList);


      for (const badgeId of badgeIds) {
        for (const timelineTime of timelineTimes) {
          for (const transferTime of transferTimes) {
            for (const ownershipTime of ownershipTimes) {
              const brokenDown: UniversalPermissionDetails[] = [{
                badgeId: badgeId,
                timelineTime: timelineTime,
                transferTime: transferTime,
                ownershipTime: ownershipTime,
                toList: toList,
                fromList: fromList,
                initiatedByList: initiatedByList,
                approvalIdList: approvalIdList,
                amountTrackerIdList: amountTrackerIdList,
                challengeTrackerIdList: challengeTrackerIdList,

                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,

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
      const [, removed] = removeUintRangesFromUintRanges(badgeIds, [origMatch.badgeId] ?? []);
      for (const removedBadgeId of removed) {
        filteredDetails.push({
          ...origMatch,
          badgeId: removedBadgeId
        })
      }
    }

    for (const match of filteredDetails) {


      const [remaining, _] = removeUintRangesFromUintRanges(match.permanentlyForbiddenTimes, neutralTimeRanges)
      neutralTimeRanges = remaining;

      const [remaining2, _x] = removeUintRangesFromUintRanges(match.permanentlyPermittedTimes, neutralTimeRanges)
      neutralTimeRanges = remaining2;

      if (neutralTimeRanges.length > 0) hasNeutralTimes = true;
      if (match.permanentlyPermittedTimes.length > 0) hasPermanentlyPermittedTimes = true;
      if (match.permanentlyForbiddenTimes.length > 0) hasPermanentlyForbiddenTimes = true;

      const base = {
        timelineTimes: usesTimelineTimes ? [match.timelineTime] : [{ start: 1n, end: GO_MAX_UINT_64 }],
        badgeIds: usesBadgeIds ? [match.badgeId] : [{ start: 1n, end: GO_MAX_UINT_64 }],
        ownershipTimes: usesOwnershipTimes ? [match.ownershipTime] : [{ start: 1n, end: GO_MAX_UINT_64 }],
        transferTimes: usesTransferTimes ? [match.transferTime] : [{ start: 1n, end: GO_MAX_UINT_64 }],
        toList: usesToList ? match.toList : getReservedAddressList("All"),
        fromList: usesFromList ? match.fromList : getReservedAddressList("All"),
        initiatedByList: usesInitiatedByList ? match.initiatedByList : getReservedAddressList("All"),
        approvalIdList: usesApprovalIdList ? match.approvalIdList : getReservedAddressList("All"),
        amountTrackerIdList: usesAmountTrackerIdList ? match.amountTrackerIdList : getReservedAddressList("All"),
        challengeTrackerIdList: usesChallengeTrackerIdList ? match.challengeTrackerIdList : getReservedAddressList("All"),
      }

      if (neutralTimeRanges.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: false,
          permissionTimes: neutralTimeRanges,
          ...base,
          neutralTimes: neutralTimeRanges,
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: []
        })
      }

      if (match.permanentlyPermittedTimes.length > 0) {
        dataSource.push({
          permitted: true,
          forbidden: false,
          permissionTimes: match.permanentlyPermittedTimes,
          ...base,
          permanentlyPermittedTimes: match.permanentlyPermittedTimes,
          permanentlyForbiddenTimes: [],
          neutralTimes: []
        })
      }

      if (match.permanentlyForbiddenTimes.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: true,
          permissionTimes: match.permanentlyForbiddenTimes,
          ...base,
          permanentlyForbiddenTimes: match.permanentlyForbiddenTimes,
          permanentlyPermittedTimes: [],
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

      } else if (column.key.endsWith('List') || column.key.endsWith('Id')) {
        let key = column.key as keyof typeof dataSource[0];
        if (column.key.endsWith('Id')) key = key + 'List' as keyof typeof dataSource[0];
        let allAreFull = true;
        for (const x of dataSource) {
          const val = x[key] as any
          if (!(val?.addresses?.length === 0 && val.whitelist === false)) {
            allAreFull = false;
          }
        }

        if (allAreFull) {
          columns = columns.filter(x => x.key !== column.key);
        }
      }
    }
  }


  const isAlwaysFrozenAndForbidden: boolean = !hasNeutralTimes && !hasPermanentlyPermittedTimes;
  const isAlwaysPermittedOrNeutral: boolean = (hasNeutralTimes && !hasPermanentlyPermittedTimes && !hasPermanentlyForbiddenTimes) || (hasPermanentlyPermittedTimes && !hasNeutralTimes && !hasPermanentlyForbiddenTimes)
  const isAlwaysFrozenAndPermitted: boolean = !hasNeutralTimes && !hasPermanentlyForbiddenTimes;
  const isCustom = !isAlwaysFrozenAndForbidden && !isAlwaysPermittedOrNeutral && !isAlwaysFrozenAndPermitted;

  return {
    columns,
    dataSource,
    hasPermanentlyPermittedTimes,
    hasNeutralTimes,
    hasPermanentlyForbiddenTimes,
    isAlwaysFrozenAndForbidden,
    isAlwaysPermittedOrNeutral,
    isAlwaysFrozenAndPermitted,
    isCustom,
    isAlwaysFrozen: !hasNeutralTimes,
  }
}

