import {
  ActionPermission,
  AddressList,
  BalancesActionPermission,
  BitBadgesCollection,
  CollectionApprovalPermissionWithDetails,
  TimedUpdatePermission,
  TimedUpdateWithBadgeIdsPermission,
  UintRangeArray,
  getPermissionVariablesFromName,
  iCollectionPermissionsWithDetails
} from 'bitbadgesjs-sdk';
import { PermissionNameString } from '../../components/collection-page/PermissionsInfo';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { GetUintRangesWithOptions, GetListWithOptions, UniversalPermissionDetails, GetFirstMatchOnly } from 'bitbadgesjs-sdk/dist/core/overlaps';
export type GenericCollectionPermissionWithDetails =
  | ActionPermission<bigint>
  | TimedUpdatePermission<bigint>
  | BalancesActionPermission<bigint>
  | TimedUpdateWithBadgeIdsPermission<bigint>
  | CollectionApprovalPermissionWithDetails<bigint>;

export interface CleanedPermissionDetails {
  timelineTimes: UintRangeArray<bigint>;
  badgeIds: UintRangeArray<bigint>;
  ownershipTimes: UintRangeArray<bigint>;
  transferTimes: UintRangeArray<bigint>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;
  approvalIdList: AddressList;
  amountTrackerIdList: AddressList;
  challengeTrackerIdList: AddressList;
  forbidden: boolean;
  permitted: boolean;
  permissionTimes: UintRangeArray<bigint>;
  neutralTimes: UintRangeArray<bigint>;
  permanentlyPermittedTimes: UintRangeArray<bigint>;
  permanentlyForbiddenTimes: UintRangeArray<bigint>;
}

export function getDetailsForCollectionPermission(
  collection: Readonly<BitBadgesCollection<bigint>> | undefined,
  permissionName: PermissionNameString,
  badgeIds?: UintRangeArray<bigint>
) {
  const permissions = collection?.collectionPermissions[permissionName as keyof iCollectionPermissionsWithDetails<bigint>];
  return getDetailsForPermission(permissions, permissionName, badgeIds);
}

export function getDetailsForPermission(
  _permissions: GenericCollectionPermissionWithDetails[] | undefined,
  permissionName: PermissionNameString,
  badgeIds?: UintRangeArray<bigint>,
  doNotMerge?: boolean
) {
  const { flags } = getPermissionVariablesFromName(permissionName);
  const usedFlags = flags;
  const permissions = _permissions ? _permissions.map((x) => x.clone().castToUniversalPermission()) : [];

  const {
    usesBadgeIds,
    usesTimelineTimes,
    usesTransferTimes,
    usesToList,
    usesFromList,
    usesInitiatedByList,
    usesOwnershipTimes,
    usesApprovalIdList,
    usesAmountTrackerIdList,
    usesChallengeTrackerIdList
  } = usedFlags;
  const hideIfFull = true;
  let columns = [
    {
      title: 'Allowed?',
      dataIndex: 'permission',
      key: 'permission'
    },
    {
      title: 'Frozen?',
      dataIndex: 'frozen',
      key: 'frozen'
    },
    {
      title: 'Times',
      dataIndex: 'permissionTimes',
      key: 'permissionTimes'
    }
  ];

  const dataSource: CleanedPermissionDetails[] = [];

  if (usesFromList) {
    columns.push({
      title: 'From',
      dataIndex: 'fromList',
      key: 'fromList'
    });
  }

  if (usesToList) {
    columns.push({
      title: 'To',
      dataIndex: 'toList',
      key: 'toList'
    });
  }

  if (usesInitiatedByList) {
    columns.push({
      title: 'Initiated By',
      dataIndex: 'initiatedByList',
      key: 'initiatedByList'
    });
  }

  if (usesTimelineTimes) {
    columns.push({
      title: 'Updatable Times',
      dataIndex: 'timelineTimes',
      key: 'timelineTimes'
    });
  }

  if (usesBadgeIds) {
    columns.push({
      title: 'Badge IDs',
      dataIndex: 'badgeIds',
      key: 'badgeIds'
    });
  }

  if (usesOwnershipTimes) {
    const isBalancesAction = usedFlags.usesBadgeIds && usedFlags.usesOwnershipTimes && !usedFlags.usesTimelineTimes;
    columns.push({
      title: isBalancesAction ? 'Circulating Times' : 'Ownership Times',
      dataIndex: 'ownershipTimes',
      key: 'ownershipTimes'
    });
  }

  if (usesTransferTimes) {
    columns.push({
      title: 'Transfer Times',
      dataIndex: 'transferTimes',
      key: 'transferTimes'
    });
  }

  if (usesApprovalIdList) {
    columns.push({
      title: 'Approval ID',
      dataIndex: 'approvalId',
      key: 'approvalIdList'
    });
  }

  if (usesAmountTrackerIdList) {
    columns.push({
      title: 'Amount Tracker ID',
      dataIndex: 'amountTrackerId',
      key: 'amountTrackerIdList'
    });
  }

  if (usesChallengeTrackerIdList) {
    columns.push({
      title: 'Challenge Tracker ID',
      dataIndex: 'challengeTrackerId',
      key: 'challengeTrackerIdList'
    });
  }

  let hasNeutralTimes = false;
  let hasPermanentlyPermittedTimes = false;
  let hasPermanentlyForbiddenTimes = false;
  let firstMatchDetails;
  if (doNotMerge) {
    firstMatchDetails = [];
    const defaultPerm = {
      timelineTimes: UintRangeArray.FullRanges(),
      fromList: AddressList.AllAddresses(),
      toList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      approvalIdList: AddressList.AllAddresses(),
      amountTrackerIdList: AddressList.AllAddresses(),
      challengeTrackerIdList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      badgeIds: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges(),

      permanentlyPermittedTimes: new UintRangeArray<bigint>(),
      permanentlyForbiddenTimes: new UintRangeArray<bigint>(),

      ...usedFlags,

      arbitraryValue: {}
    };

    for (const permission of [...permissions, defaultPerm]) {
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
              const brokenDown: UniversalPermissionDetails[] = [
                {
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

                  arbitraryValue
                }
              ];

              for (const broken of brokenDown) {
                firstMatchDetails.push(broken);
              }
            }
          }
        }
      }
    }
  } else {
    firstMatchDetails = GetFirstMatchOnly(permissions, true, usedFlags);
  }

  //Neutral times = not explicitly permitted and not explicitly forbidden
  for (const origMatch of firstMatchDetails) {
    const neutralTimeRanges = UintRangeArray.FullRanges();

    let filteredDetails: UniversalPermissionDetails[] = [origMatch];
    if (badgeIds && usesBadgeIds) {
      filteredDetails = [];
      const removed = badgeIds.getOverlaps(origMatch.badgeId);
      for (const removedBadgeId of removed) {
        filteredDetails.push({
          ...origMatch,
          badgeId: removedBadgeId
        });
      }
    }

    for (const match of filteredDetails) {
      neutralTimeRanges.remove(match.permanentlyForbiddenTimes);
      neutralTimeRanges.remove(match.permanentlyPermittedTimes);

      if (neutralTimeRanges.length > 0) hasNeutralTimes = true;
      if (match.permanentlyPermittedTimes.length > 0) hasPermanentlyPermittedTimes = true;
      if (match.permanentlyForbiddenTimes.length > 0) hasPermanentlyForbiddenTimes = true;

      const base = {
        timelineTimes: usesTimelineTimes ? UintRangeArray.From([match.timelineTime]) : UintRangeArray.FullRanges(),
        badgeIds: usesBadgeIds ? UintRangeArray.From([match.badgeId]) : UintRangeArray.FullRanges(),
        ownershipTimes: usesOwnershipTimes ? UintRangeArray.From([match.ownershipTime]) : UintRangeArray.FullRanges(),
        transferTimes: usesTransferTimes ? UintRangeArray.From([match.transferTime]) : UintRangeArray.FullRanges(),
        toList: usesToList ? match.toList : AddressList.AllAddresses(),
        fromList: usesFromList ? match.fromList : AddressList.AllAddresses(),
        initiatedByList: usesInitiatedByList ? match.initiatedByList : AddressList.AllAddresses(),
        approvalIdList: usesApprovalIdList ? match.approvalIdList : AddressList.AllAddresses(),
        amountTrackerIdList: usesAmountTrackerIdList ? match.amountTrackerIdList : AddressList.AllAddresses(),
        challengeTrackerIdList: usesChallengeTrackerIdList ? match.challengeTrackerIdList : AddressList.AllAddresses()
      };

      if (neutralTimeRanges.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: false,
          permissionTimes: neutralTimeRanges,
          ...base,
          neutralTimes: neutralTimeRanges,
          permanentlyPermittedTimes: UintRangeArray.From([]),
          permanentlyForbiddenTimes: UintRangeArray.From([])
        });
      }

      if (match.permanentlyPermittedTimes.length > 0) {
        dataSource.push({
          permitted: true,
          forbidden: false,
          permissionTimes: match.permanentlyPermittedTimes,
          ...base,
          permanentlyPermittedTimes: match.permanentlyPermittedTimes,
          permanentlyForbiddenTimes: UintRangeArray.From([]),
          neutralTimes: UintRangeArray.From([])
        });
      }

      if (match.permanentlyForbiddenTimes.length > 0) {
        dataSource.push({
          permitted: false,
          forbidden: true,
          permissionTimes: match.permanentlyForbiddenTimes,
          ...base,
          permanentlyForbiddenTimes: match.permanentlyForbiddenTimes,
          permanentlyPermittedTimes: UintRangeArray.From([]),
          neutralTimes: UintRangeArray.From([])
        });
      }
    }
  }

  //If anything is "All" or full, just don't show it
  //Isn't worth confusing the average user
  if (hideIfFull) {
    for (const column of columns) {
      if ((column.key.endsWith('Times') || column.key.endsWith('Ids')) && column.key !== 'permissionTimes') {
        const key = column.key as keyof (typeof dataSource)[0];
        let allAreFull = true;
        for (const x of dataSource) {
          const val = x[key] as any;
          if (!(val?.length === 1 && val[0].start === 1n && val[0].end === GO_MAX_UINT_64)) {
            allAreFull = false;
          }
        }

        if (allAreFull) {
          columns = columns.filter((x) => x.key !== column.key);
        }
      } else if (column.key.endsWith('List') || column.key.endsWith('Id')) {
        let key = column.key as keyof (typeof dataSource)[0];
        if (column.key.endsWith('Id')) key = (key + 'List') as keyof (typeof dataSource)[0];
        let allAreFull = true;
        for (const x of dataSource) {
          const val = x[key] as any;
          if (!(val?.addresses?.length === 0 && val.whitelist === false)) {
            allAreFull = false;
          }
        }

        if (allAreFull) {
          columns = columns.filter((x) => x.key !== column.key);
        }
      }
    }
  }

  const isAlwaysFrozenAndForbidden: boolean = !hasNeutralTimes && !hasPermanentlyPermittedTimes;
  const isAlwaysPermittedOrNeutral: boolean =
    (hasNeutralTimes && !hasPermanentlyPermittedTimes && !hasPermanentlyForbiddenTimes) ||
    (hasPermanentlyPermittedTimes && !hasNeutralTimes && !hasPermanentlyForbiddenTimes);
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
    isAlwaysFrozen: !hasNeutralTimes
  };
}
