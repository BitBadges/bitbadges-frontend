import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, StopOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { AddressMapping, UintRange } from "bitbadgesjs-proto";
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, GetFirstMatchOnly, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UniversalPermission, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, removeUintRangeFromUintRange, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { UsedFlags } from 'bitbadgesjs-utils'
import { getBadgeIdsString } from "../../utils/badgeIds";



export function getPermissionDataSource(permissions: UniversalPermission[], usedFlags: UsedFlags, neverHasManager?: boolean, badgeId?: bigint) {
  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToMapping, usesFromMapping, usesInitiatedByMapping, usesOwnershipTimes } = usedFlags;

  const columns = [{
    title: 'State',
    dataIndex: 'permission',
    key: 'permission',
    render: () => { return <></> }
  },
  {
    title: 'Locked?',
    dataIndex: 'frozen',
    key: 'frozen',
    render: (frozen: boolean) => { return frozen ? <LockOutlined /> : <></> }

  },
  {
    title: 'Permission Times',
    dataIndex: 'permissionTimes',
    key: 'permissionTimes',
    render: (permissionTimes: UintRange<bigint>[]) => {
      return <>{getTimeRangesElement(permissionTimes, '', true)}</>
    }
  }];
  const dataSource: {
    timelineTimes?: UintRange<bigint>[],
    badgeIds?: UintRange<bigint>[],
    ownershipTimes?: UintRange<bigint>[],
    transferTimes?: UintRange<bigint>[],
    toMapping?: AddressMapping,
    fromMapping?: AddressMapping,
    initiatedByMapping?: AddressMapping,
    forbidden: boolean,
    permitted: boolean,
    permissionTimes: UintRange<bigint>[],
  }[] = [];

  if (usesTimelineTimes) {
    columns.push({
      title: 'Timeline Times',
      dataIndex: 'timelineTimes',
      key: 'timelineTimes',
      render: (timelineTimes: UintRange<bigint>[]) => {
        return <>{getTimeRangesElement(timelineTimes, '', true)}</>
      }
    })
  }

  if (usesBadgeIds) {
    columns.push({
      title: 'Badge IDs',
      dataIndex: 'badgeIds',
      key: 'badgeIds',
      render: (badgeIds: UintRange<bigint>[]) => {
        if (badgeId && badgeId > 0n) {
          return <>{badgeId.toString()}</>
        }

        return <>{badgeIds.map(x => x.start.toString() + '-' + x.end.toString()).join(', ')}</>
      }
    })
  }

  if (usesOwnershipTimes) {
    columns.push({
      title: 'Ownership Times',
      dataIndex: 'ownershipTimes',
      key: 'ownershipTimes',
      render: (ownershipTimes: UintRange<bigint>[]) => {
        return <>{getTimeRangesElement(ownershipTimes, '', true)}</>
      }
    })
  }

  if (usesTransferTimes) {
    columns.push({
      title: 'Transfer Times',
      dataIndex: 'transferTimes',
      key: 'transferTimes',
      render: (transferTimes: UintRange<bigint>[]) => {
        return <>{getTimeRangesElement(transferTimes, '', true)}</>
      }
    })
  }


  let hasNeutralTimes = false;
  let hasPermittedTimes = false;
  let hasForbiddenTimes = false;
  const firstMatchDetails = GetFirstMatchOnly(permissions, true, usedFlags);


  //Neutral times = not explicitly permitted and not explicitly forbidden
  for (const match of firstMatchDetails) {
    let neutralTimeRanges = [{ start: 1n, end: GO_MAX_UINT_64 }];

    const [remaining, _] = removeUintRangeFromUintRange(match.forbiddenTimes, neutralTimeRanges)
    neutralTimeRanges = remaining;

    const [remaining2, _x] = removeUintRangeFromUintRange(match.permittedTimes, neutralTimeRanges)
    neutralTimeRanges = remaining2;

    if (neutralTimeRanges.length > 0) hasNeutralTimes = true;
    if (match.permittedTimes.length > 0) hasPermittedTimes = true;
    if (match.forbiddenTimes.length > 0) hasForbiddenTimes = true;

    dataSource.push({
      timelineTimes: usesTimelineTimes ? [match.timelineTime] : undefined,
      badgeIds: usesBadgeIds ? [match.badgeId] : undefined,
      ownershipTimes: usesOwnershipTimes ? [match.ownershipTime] : undefined,
      transferTimes: usesTransferTimes ? [match.transferTime] : undefined,
      toMapping: usesToMapping ? match.toMapping : undefined,
      fromMapping: usesFromMapping ? match.fromMapping : undefined,
      initiatedByMapping: usesInitiatedByMapping ? match.initiatedByMapping : undefined,
      permitted: match.permittedTimes.length > 0,
      forbidden: match.forbiddenTimes.length > 0,
      permissionTimes: match.permittedTimes.length > 0 ? match.permittedTimes : match.forbiddenTimes.length > 0 ? match.forbiddenTimes : neutralTimeRanges
    })
  }

  return { columns, dataSource, hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes, neverHasManager }
}

export const PermissionIcon = (permissions: UniversalPermission[], helperMsg: string, usedFlags: UsedFlags, neverHasManager?: boolean, badgeId?: bigint,) => {
  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesOwnershipTimes } = usedFlags;

  const { columns, dataSource, hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes } = getPermissionDataSource(permissions, usedFlags, neverHasManager, badgeId);

  return <>
    <Popover color='black' className="primary-text" content={<div style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', backgroundColor: 'black', color: 'white' }}>
      {
        neverHasManager ? <p>
          {`There is and will never be a manager for this collection, so this permission can never be executed.`}
        </p> :
          !hasPermittedTimes && !hasForbiddenTimes && hasNeutralTimes ? <p>
            {`This permission currently is permitted for all times and values. However, it is not frozen, meaning it could be updated in the future. It can also be frozen to be either permanently allowed or disallowed.`}
          </p> :
            hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes ? <p>
              {`This permission is currently forbidden for all times and values. It is also frozen, so it will always remain forbidden.`}
            </p> :
              hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes ? <p>
                {`This permission is currently permitted to be executed by the manager for all times and values. It is also frozen, so it will always remain permitted.`}
              </p> :
                <>
                  {usesTimelineTimes && !usesBadgeIds && <p>
                    {`This permission is for a timeline-based property, meaning its value can vary dependent on the current time. For each row in the table, apply the following logic: `}
                    <br />
                    <br />
                    {`During the Permission Times, the manager can or can't update the property\'s value (${helperMsg}) for the corresponding Timeline Times. `}
                    <br />
                  </p>}

                  {usesTimelineTimes && usesBadgeIds && <p>
                    {`This permission is for a badge-specific and timeline-based property, meaning its value for specific badge IDs can vary dependent on the current time. For each row in the table, apply the following logic: `}
                    <br />
                    <br />
                    {`During the Permission Times, the manager can or can't update the property\'s value (${helperMsg}) for the corresponding Timeline Times for the specified Badge IDs.`}
                    <br />
                  </p>}

                  {usesBadgeIds && usesOwnershipTimes && <p>
                    {'For each row in the table, apply the following logic: '}
                    <br />
                    <br />
                    {`During the Permission Times, the manager can or can't increment the supply of the Badge IDs that can be owned during Ownership Times.`}
                    <br />
                  </p>}

                  {usesBadgeIds && usesTransferTimes && <p>
                    {`This permission is for a timeline-based property, meaning its value can vary dependent on the current time. For each row in the table, apply the following logic: `}
                    <br />
                    <br />
                    {`During the Permission Times, the manager can or can't update the transferability for the corresponding Timeline Times. Transferability is broken down to a six-headed property (to, from, initiated by - who sent to who? and who initiated the transfer?, transfer time - when did it take place?, badge IDs - which badges were transferred?, and ownership times - what ownership times for the badges were transferred?). For a transfer to match, it must match all six values. Transferability values can be mixed and matched.`}
                    <br />
                  </p>}

                  <table>
                    <tr>
                      {columns.map(x => {
                        return <td key={x.key} style={{ padding: 8 }}>{x.title}</td>
                      })}
                    </tr>

                    {dataSource.map((y, idx) => {


                      if (badgeId && badgeId > 0n) {
                        const [_, found] = searchUintRangesForId(badgeId, y.badgeIds ?? []);
                        if (!found) {
                          return <></>
                        }

                        y.badgeIds = [{ start: badgeId, end: badgeId }];
                      }

                      return <tr key={idx} style={{ borderTop: '1px solid white' }}>
                        {y.forbidden && !y.permitted && <><td style={{ padding: 8 }}>Forbidden </td> <td>Yes</td></>}
                        {y.permitted && !y.forbidden && <><td style={{ padding: 8 }}>Permitted </td> <td>Yes</td></>}
                        {!y.permitted && !y.forbidden && <><td style={{ padding: 8 }}>Permitted </td> <td>No</td></>}
                        {y.permissionTimes && <td style={{ padding: 8 }}>{getTimeRangesElement(y.permissionTimes, '', true, false, false)}</td>}
                        {y.timelineTimes && <td style={{ padding: 8 }}>{getTimeRangesElement(y.timelineTimes, '', true, false, false)}</td>}
                        {y.badgeIds && <td style={{ padding: 8 }}>{getBadgeIdsString(y.badgeIds)}</td>}
                        {y.ownershipTimes && <td style={{ padding: 8 }}>{getTimeRangesElement(y.ownershipTimes, '', true, false, false)}</td>}
                        {y.transferTimes && <td style={{ padding: 8 }}>{getTimeRangesElement(y.transferTimes, '', true, false, false)}</td>}
                        {y.toMapping && <td style={{ padding: 8 }}>
                          <AddressDisplayList
                            users={y.toMapping.addresses}
                            allExcept={!y.toMapping.includeAddresses}
                          />
                        </td>}
                        {y.fromMapping && <td style={{ padding: 8 }}>
                          <AddressDisplayList
                            users={y.fromMapping.addresses}
                            allExcept={!y.fromMapping.includeAddresses}
                            filterMint
                          />
                        </td>}

                        {y.initiatedByMapping && <td style={{ padding: 8 }}>
                          <AddressDisplayList
                            users={y.initiatedByMapping.addresses}
                            allExcept={!y.initiatedByMapping.includeAddresses}
                            filterMint
                          />
                        </td>}
                      </tr>
                    })}

                  </table>
                  {
                    usesBadgeIds && badgeId != undefined && <p>
                      <br />
                      {`*Permissions were filtered to only include this badge (ID ${badgeId}).`}
                    </p>
                  }
                </>}
    </div >
    }>

      {!(hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)
        && !(hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes) &&
        !neverHasManager &&
        <>
          <CheckCircleOutlined style={{ marginLeft: 4, color: 'green' }} />
          {hasForbiddenTimes && <StopOutlined style={{ marginLeft: 4, color: 'red' }} />}
          <ClockCircleOutlined style={{ marginLeft: 4 }} />
        </>
      }
      {
        (neverHasManager || (hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)) && <>
          <StopOutlined style={{ marginLeft: 4, color: 'red' }} />
          <ClockCircleOutlined style={{ marginLeft: 4, color: 'red' }} />
        </>
      }
      {
        hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes &&
        !neverHasManager && <>
          <CheckCircleOutlined style={{ marginLeft: 4, color: 'green' }} />
          <ClockCircleOutlined style={{ marginLeft: 4, color: 'green' }} />
        </>}
    </Popover >
  </>
}




export function PermissionsOverview({
  collectionId,
  span,
  badgeId
}: {
  collectionId: bigint
  span?: number
  badgeId?: bigint
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  if (!collection?.collectionPermissions) return <></>

  const neverHasManager = (collection?.managerTimeline && collection?.managerTimeline.length === 0)
    || (collection?.managerTimeline && collection?.managerTimeline.length > 0 && collection.managerTimeline.every(x => !x.manager));

  const isBadgeView = badgeId !== undefined;

  return <InformationDisplayCard title={'Permissions'} span={span}>
    <>
      <>
        {!isBadgeView && <TableRow label={"Delete collection?"} value={PermissionIcon(castActionPermissionToUniversalPermission(collection.collectionPermissions.canDeleteCollection), "", ActionPermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Archive collection?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canArchiveCollection), "archived or not", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update contract address?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateContractAddress), "contract address", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update standards?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateStandards), "standards", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update custom data?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCustomData), "custom data", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Transfer manager?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateManager), "manager", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update collection metadata URL?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionMetadata), "collection metadata", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}

        {/* Can Be Badge-Specific */}
        {collection.balancesType === "Off-Chain" && <TableRow label={"Update off-chain balances URL?"} value={PermissionIcon(castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateOffChainBalancesMetadata), "off-chain balances URL", TimedUpdatePermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {<TableRow label={"Update badge metadata URL?"} value={PermissionIcon(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection.collectionPermissions.canUpdateBadgeMetadata), "badge metadata", TimedUpdateWithBadgeIdsPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {collection.balancesType === "Inherited" && <TableRow label={"Update inherited balances?"} value={PermissionIcon(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection.collectionPermissions.canUpdateInheritedBalances), "inherited balances", TimedUpdateWithBadgeIdsPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {<TableRow label={"Create more badges?"} value={PermissionIcon(castBalancesActionPermissionToUniversalPermission(collection.collectionPermissions.canCreateMoreBadges), "", BalancesActionPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {collection.balancesType === "Standard" && <TableRow label={"Update collection-level transferability?"} value={PermissionIcon(castCollectionApprovedTransferPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovedTransfers), "collection approved transfers", ApprovedTransferPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
      </>
    </>
  </InformationDisplayCard>
}