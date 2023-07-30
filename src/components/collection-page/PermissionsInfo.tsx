import { CheckCircleFilled, ClockCircleOutlined, StopOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { UintRange, ValueOptions } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, UniversalCombination, UniversalPermission, invertUintRanges, removeUintRangeFromUintRange, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE, getTimeRangesString } from "../../utils/dates";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";


interface UsedFlags {
  usesBadgeIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToMapping: boolean;
  usesFromMapping: boolean;
  usesInitiatedByMapping: boolean;
  usesOwnedTimes: boolean;
}

const ActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnedTimes: false,
}

const TimedUpdatePermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnedTimes: false,
}

const TimedUpdateWithBadgeIdsPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnedTimes: false,
}


const BalancesActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnedTimes: true,
}


const ApprovedTransferPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: true,
  usesToMapping: true,
  usesFromMapping: true,
  usesInitiatedByMapping: true,
  usesOwnedTimes: true,
}

const manipulateUintRanges = (uintRanges: UintRange<bigint>[], valueOptions: ValueOptions) => {
  if (valueOptions.invertDefault) {
    uintRanges = invertUintRanges(uintRanges, 1n, FOREVER_DATE);
  } else if (valueOptions.allValues) {
    uintRanges = [{ start: 1n, end: FOREVER_DATE }];
  } else if (valueOptions.noValues) {
    uintRanges = [];
  }

  return uintRanges
}

export const PermissionIcon = (permissions: UniversalPermission[], verb: string, usedFlags: UsedFlags, badgeId?: bigint) => {
  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToMapping, usesFromMapping, usesInitiatedByMapping, usesOwnedTimes } = usedFlags;

  if (badgeId && badgeId > 0n && usesBadgeIds) {
    permissions = permissions.map(x => {
      const defaultBadgeIds = x.defaultValues.badgeIds;
      const newCombinations: UniversalCombination[] = [];

      for (const combination of x.combinations) {
        let badgeIds = manipulateUintRanges(defaultBadgeIds, combination.badgeIdsOptions);

        const [_, found] = searchUintRangesForId(badgeId, badgeIds);
        if (found) {
          newCombinations.push(combination);
        }
      }

      return {
        ...x,
        combinations: newCombinations
      };
    });
  }

  const neutralStrings: string[] = [];
  const permittedStrings: string[] = [];
  const forbiddenStrings: string[] = [];

  //We append a permission with empty permitted, forbidden times but ALL criteria. 
  //This is to ensure we always handle and define all values
  permissions.push({
    defaultValues: {
      timelineTimes: [],
      fromMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
      toMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
      initiatedByMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
      transferTimes: [],
      badgeIds: [],
      ownedTimes: [],

      permittedTimes: [],
      forbiddenTimes: [],

      ...usedFlags,

      arbitraryValue: {},
    },
    combinations: [{
      timelineTimesOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      fromMappingOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      toMappingOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      initiatedByMappingOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      transferTimesOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      badgeIdsOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      ownedTimesOptions: {
        invertDefault: false,
        allValues: true,
        noValues: false
      },
      permittedTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: true
      },
      forbiddenTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: true
      },
    }]
  })

  const firstMatchDetails = GetFirstMatchOnly(permissions);
  for (const match of firstMatchDetails) {
    let neutralTimeRanges = [{ start: 1n, end: FOREVER_DATE }];

    const [remaining, _] = removeUintRangeFromUintRange(match.forbiddenTimes, neutralTimeRanges)
    neutralTimeRanges = remaining;

    const [remaining2, _x] = removeUintRangeFromUintRange(match.permittedTimes, neutralTimeRanges)
    neutralTimeRanges = remaining2;

    let matchStrCriteria: string[] = [];
    if (usesTimelineTimes) {
      matchStrCriteria.push('for the times ' + getTimeRangesString([match.timelineTime], '', true));
    }

    if (usesBadgeIds) {
      matchStrCriteria.push('for the badges ' + match.badgeId.start.toString() + '-' + match.badgeId.end.toString());
    }

    if (usesOwnedTimes) {
      matchStrCriteria.push('owned ' + getTimeRangesString([match.ownershipTime], '', true));
    }

    if (usesTransferTimes) {
      matchStrCriteria.push('transferred at ' + getTimeRangesString([match.ownershipTime], '', true));
    }

    if (usesFromMapping) {
      matchStrCriteria.push('from ' + match.toMapping)
    }

    if (usesToMapping) {
      matchStrCriteria.push('to ' + match.initiatedByMapping)
    }

    if (usesInitiatedByMapping) {
      matchStrCriteria.push('initiated by ' + match.initiatedByMapping)
    }

    let matchStr = matchStrCriteria.join(' ');

    if (neutralTimeRanges.length > 0) neutralStrings.push(getTimeRangesString(neutralTimeRanges, '', true) + ' ' + matchStr);
    if (match.permittedTimes.length > 0) permittedStrings.push(getTimeRangesString(match.permittedTimes, '', true) + ' ' + matchStr);
    if (match.forbiddenTimes.length > 0) forbiddenStrings.push(getTimeRangesString(match.forbiddenTimes, '', true) + ' ' + matchStr);
  }


  return <>
    <Tooltip color='black' title={<div style={{ textAlign: 'center' }}>
      {/* {!(forbiddenStrings.length > 0 && neutralStrings.length == 0 && permittedStrings.length == 0)
        && !(permittedStrings.length > 0 && neutralStrings.length == 0 && forbiddenStrings.length == 0) &&
        "Time-Dependent"}
      <br />
      <br /> */}
      {`Permanently ${verb}: `}
      {permittedStrings.length > 0 ? <>
        {permittedStrings.join(' OR ')}
      </> : 'No Times'}
      <br />
      <br />
      {`Permanently non-${verb}: `}
      {forbiddenStrings.length > 0 ? <>
        {forbiddenStrings.join(' OR ')}
      </> : 'No Times'}
      <br />
      <br />
      {`${verb.length > 0 && verb[0].toUpperCase() + verb.substring(1)} (but can be set to non-${verb}): `}
      {neutralStrings.length > 0 ? <>
        {neutralStrings.join(' OR ')}
      </> : 'No Times'}
    </div>
    }>
      {!(forbiddenStrings.length > 0 && neutralStrings.length == 0 && permittedStrings.length == 0)
        && !(permittedStrings.length > 0 && neutralStrings.length == 0 && forbiddenStrings.length == 0) &&

        <ClockCircleOutlined style={{ marginLeft: 8 }} />}
      {forbiddenStrings.length > 0 && neutralStrings.length == 0 && permittedStrings.length == 0 &&
        <StopOutlined style={{ marginLeft: 8, color: 'red' }} />}
      {permittedStrings.length > 0 && neutralStrings.length == 0 && forbiddenStrings.length == 0 &&
        <CheckCircleFilled style={{ marginLeft: 8, color: 'green' }} />}
    </Tooltip>
  </>
}




export function PermissionsOverview({
  collectionId,
  span,
  isBadgeView,
  isOffChainBalances
}: {
  collectionId: bigint
  span?: number
  isBadgeView?: boolean,
  isOffChainBalances?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  // const collection = MockCollection;

  console.log(isBadgeView, isOffChainBalances) //For TS

  if (!collection?.collectionPermissions) return <></>


  return <InformationDisplayCard title={'Manager Permissions'} span={span}>
    <>
      <>
        {!isBadgeView && <TableRow label={"Archive collection?"} value={PermissionIcon(collection.collectionPermissions.canArchiveCollection.map(x => {
          const castedPermission: UniversalPermission = {
            defaultValues: {
              timelineTimes: x.defaultValues.timelineTimes,
              badgeIds: [{ start: 1n, end: FOREVER_DATE }],
              ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
              transferTimes: [{ start: 1n, end: FOREVER_DATE }],

              ...TimedUpdatePermissionUsedFlags,

              fromMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
              toMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
              initiatedByMapping: { mappingId: 'All', addresses: [], includeAddresses: false, uri: '', customData: '' },
              permittedTimes: x.defaultValues.permittedTimes,
              forbiddenTimes: x.defaultValues.forbiddenTimes,

              arbitraryValue: {},
            },
            combinations: x.combinations.map(y => {
              return {
                ...y,
                fromMappingOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
                toMappingOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
                initiatedByMappingOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
                transferTimesOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
                badgeIdsOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
                ownedTimesOptions: {
                  invertDefault: false,
                  allValues: true,
                  noValues: false
                },
              }
            })
          };

          return castedPermission;
        }), 'archivable', TimedUpdatePermissionUsedFlags)} labelSpan={20} valueSpan={4} />}

        {/* 
          //TODO: Cast all permissions w/ badge option
        */}

        {!isBadgeView && <TableRow label={"Add badges to the collection?"} value={collection.collectionPermissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isBadgeView && <TableRow label={"Transfer the role of manager?"} value={collection.collectionPermissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Edit metadata URLs?"} value={collection.collectionPermissions.CanUpdateMetadataUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isOffChainBalances && <TableRow label={"Edit transferability?"} value={collection.collectionPermissions.CanUpdateAllowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Can delete collection?"} value={collection.collectionPermissions.CanDelete ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {isOffChainBalances && <TableRow label={"Can update balances?"} value={collection.collectionPermissions.CanUpdateBalancesUri ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
      </>
    </>
  </InformationDisplayCard>
}