import { CheckCircleFilled, ClockCircleFilled, ClockCircleOutlined, CloseCircleOutlined, LockOutlined, StopFilled } from "@ant-design/icons";
import { Popover, Typography } from "antd";
import { AddressMapping, UintRange } from "bitbadgesjs-proto";
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, GetFirstMatchOnly, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UniversalPermission, UsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, getReservedAddressMapping, isInAddressMapping, removeUintRangeFromUintRange, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { getBadgeIdsString } from "../../utils/badgeIds";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";



export function getPermissionDataSource(permissions: UniversalPermission[], usedFlags: UsedFlags, neverHasManager?: boolean, badgeId?: bigint) {
  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToMapping, usesFromMapping, usesInitiatedByMapping, usesOwnershipTimes } = usedFlags;

  const columns = [{
    title: 'State',
    dataIndex: 'permission',
    key: 'permission',
    render: () => { return <></> }
  },
  {
    title: 'Frozen?',
    dataIndex: 'frozen',
    key: 'frozen',
    render: (frozen: boolean) => { return frozen ? <LockOutlined /> : <></> }

  },
  {
    title: 'Executable?',
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
      title: 'Updatable Times',
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
    const isBalancesAction = usedFlags.usesBadgeIds && usedFlags.usesOwnershipTimes && !usedFlags.usesTimelineTimes;
    columns.push({
      title: isBalancesAction ? 'Circulating Times' : 'Ownership Times',
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

  if (usesFromMapping) {
    columns.push({
      title: 'From',
      dataIndex: 'fromMapping',
      key: 'fromMapping',
      render: (fromMapping: any) => {
        return <AddressDisplayList
          users={fromMapping.addresses}
          allExcept={!fromMapping.includeAddresses}
        />
      }
    })
  }

  if (usesToMapping) {
    columns.push({
      title: 'To',
      dataIndex: 'toMapping',
      key: 'toMapping',
      render: (toMapping: any) => {
        return <AddressDisplayList
          users={toMapping.addresses}
          allExcept={!toMapping.includeAddresses}
          filterMint
        />
      }
    })
  }

  if (usesInitiatedByMapping) {
    columns.push({
      title: 'Initiated By',
      dataIndex: 'initiatedByMapping',
      key: 'initiatedByMapping',
      render: (initiatedByMapping: any) => {
        return <AddressDisplayList
          users={initiatedByMapping.addresses}
          allExcept={!initiatedByMapping.includeAddresses}
          filterMint
        />
      }
    })
  }


  let hasNeutralTimes = false;
  let hasPermittedTimes = false;
  let hasForbiddenTimes = false;
  const firstMatchDetails = GetFirstMatchOnly(permissions, true, usedFlags);

  console.log("First match details", firstMatchDetails);


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

    const base = {

      timelineTimes: usesTimelineTimes ? [match.timelineTime] : undefined,
      badgeIds: usesBadgeIds ? [match.badgeId] : undefined,
      ownershipTimes: usesOwnershipTimes ? [match.ownershipTime] : undefined,
      transferTimes: usesTransferTimes ? [match.transferTime] : undefined,
      toMapping: usesToMapping ? match.toMapping : undefined,
      fromMapping: usesFromMapping ? match.fromMapping : undefined,
      initiatedByMapping: usesInitiatedByMapping ? match.initiatedByMapping : undefined,
    }

    if (neutralTimeRanges.length > 0) {
      dataSource.push({
        permitted: false,
        forbidden: false,
        permissionTimes: neutralTimeRanges,
        ...base
      })
    }
    if (match.permittedTimes.length > 0) {
      dataSource.push({
        permitted: true,
        forbidden: false,
        permissionTimes: match.permittedTimes,
        ...base
      })
    }

    if (match.forbiddenTimes.length > 0) {
      console.log(hasForbiddenTimes, match.forbiddenTimes);
      dataSource.push({
        permitted: false,
        forbidden: true,
        permissionTimes: match.forbiddenTimes,
        ...base
      })
    }
  }

  return { columns, dataSource, hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes, neverHasManager }
}

export const PermissionDisplay = (permissionName: string, permissions: UniversalPermission[], helperMsg: string, usedFlags: UsedFlags, neverHasManager?: boolean, badgeId?: bigint, mintOnly?: boolean, nonMintOnly?: boolean) => {


  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesOwnershipTimes } = usedFlags;

  const { columns, dataSource, hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes } = getPermissionDataSource(permissions, usedFlags, neverHasManager, badgeId);

  let question = "";


  switch (permissionName) {
    case 'canDeleteCollection':
      question = "Can delete the collection?";
      break;
    case 'canArchiveCollection':
      question = "Can archive the collection?";
      break;
    case 'canUpdateContractAddress':
      question = "Can update the contract address?";
      break;
    case 'canUpdateOffChainBalancesMetadata':
      question = "Can update the off-chain balances metadata?";
      break;
    case 'canUpdateStandards':
      question = "Can update the standards?";
      break;
    case 'canUpdateCustomData':
      question = "Can update the custom data?";
      break;
    case 'canUpdateManager':
      question = "Can update the manager?";
      break;
    case 'canUpdateCollectionMetadata':
      question = "Can update the collection metadata?";
      break;
    case 'canCreateMoreBadges':
      question = "Can create more badges?";
      break;
    case 'canUpdateBadgeMetadata':
      question = "Can update the badge metadata?";
      break;
    case 'canUpdateCollectionApprovedTransfers':
      question = "Can update collection approved transfers?";
      break;
    // Add custom questions for other permissions as needed
  }




  return <>
    {/* :
            !hasPermittedTimes && !hasForbiddenTimes && hasNeutralTimes ? <p>
              {`The permission is currently permitted. However, it is not frozen and can change.`}
            </p> :
              hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes ? <p>
                {`This permission will always be forbidden.`}
              </p> :
                hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes ? <p>
                  {`This permission will always be permitted.`}
                </p> :
                  <>
                    {usesTimelineTimes && !usesBadgeIds && <p>
                      {`This permission is for a timeline-based property, meaning its value can vary dependent on the current time. For each row in the table, apply the following logic: `}
                      <br />
                      <br />
                      {`During the permission times, the manager can or can't update the property\'s value (${helperMsg}) for the corresponding timeline times. `}
                      <br />
                    </p>}

                    {usesTimelineTimes && usesBadgeIds && <p>
                      {`This permission is for a badge-specific and timeline-based property, meaning its value for specific badge IDs can vary dependent on the current time. For each row in the table, apply the following logic: `}
                      <br />
                      <br />
                      {`During the permission times, the manager can or can't update the property\'s value (${helperMsg}) for the corresponding timeline times for the specified Badge IDs.`}
                      <br />
                    </p>}

                    {usesBadgeIds && usesOwnershipTimes && <p>
                      {`During the permission times, can the manager increment the supply of the Badge IDs that can be owned during the ownership times (circulating times)?`}
                      <br />
                    </p>}

                    {usesBadgeIds && usesTransferTimes && <p>
                      {`This permission is for a timeline-based property, meaning its value can vary dependent on the current time. For each row in the table, apply the following logic: `}
                      <br />
                      <br />
                      {`During the permission times, the manager can or can't update the transferability for the corresponding timeline times. Transferability is broken down to a six-headed property (to, from, initiated by - who sent to who? and who initiated the transfer?, transfer time - when did it take place?, badge IDs - which badges were transferred?, and ownership times - what ownership times for the badges were transferred?). For a transfer to match, it must match all six values. Transferability values can be mixed and matched.`}
                      <br />
                    </p>}
                  </>
        }
      </div> */}
    <div style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', color: 'white', }}>
      <div className="" style={{ marginBottom: 16, alignItems: 'normal', width: '100%' }}>
        {
          neverHasManager ? <p>
            {`There is and will never be a manager for this collection, so this permission can never be executed.`}
          </p>
            : <div style={{ textAlign: 'center' }} className='primary-text'>
              <Typography.Text strong style={{ fontSize: 20, textAlign: 'center' }} className='primary-text'>{question} </Typography.Text>
              <br />
              <br />

              <div style={{ overflow: 'auto', }} className="primary-text flex-center">
                <table style={{ textAlign: 'center', overflow: 'auto', }}>


                  <tr style={{ border: '1px solid white' }}>
                    {columns.map((x, idx) => {
                      return <td key={x.key} style={{
                        padding: 8, fontWeight: 'bold', fontSize: 16,
                        borderRight: idx === 2 ? '1px solid white' : undefined,
                      }}>{x.title}</td>
                    })}
                  </tr>
                  {/* <tr style={{  border: '1px solid white', borderTop: 'none' }}>
                <td colSpan={3} style={{ padding: 8, fontWeight: 'bold', fontSize: 12, borderRight: '1px solid white' }}>Can the manager execute this permission? When?</td>


                <td colSpan={columns.length - 3} style={{ padding: 8, fontWeight: 'bold', fontSize: 12 }}>For what values?</td>

              </tr> */}

                  {dataSource.map((y, idx) => {

                    if ((mintOnly && (!y.fromMapping || !isInAddressMapping(y.fromMapping, "Mint")))) {
                      return null;
                    }

                    if (mintOnly) {
                      y.fromMapping = getReservedAddressMapping("Mint", "")
                    }




                    if (badgeId && badgeId > 0n) {
                      const [_, found] = searchUintRangesForId(badgeId, y.badgeIds ?? []);
                      if (!found) {
                        return <></>
                      }

                      y.badgeIds = [{ start: badgeId, end: badgeId }];
                    }

                    return <tr key={idx} style={{ border: '1px solid white' }}>
                      {y.forbidden && !y.permitted && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Forbidden <CloseCircleOutlined style={{ color: 'red' }} /> </td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Yes</td></>}
                      {y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Permitted <CheckCircleFilled style={{ color: 'green' }} /></td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Yes</td></>}
                      {!y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Permitted <CheckCircleFilled style={{ color: 'green' }} /> </td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>No</td></>}
                      {y.permissionTimes && <td style={{
                        padding: 8, fontWeight: 'bold', fontSize: 16,
                        borderRight: columns.length > 3 ? '1px solid white' : undefined
                      }}>{getTimeRangesElement(y.permissionTimes, '', true, false, false)}
                      </td>
                      }
                      {y.timelineTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.timelineTimes, '', true, false, false)}</td>}
                      {y.badgeIds && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getBadgeIdsString(y.badgeIds)}</td>}
                      {y.ownershipTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.ownershipTimes, '', true, false, false)}</td>}
                      {y.transferTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.transferTimes, '', true, false, false)}</td>}
                      {
                        y.fromMapping && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                          <AddressDisplayList
                            users={y.fromMapping.addresses}
                            allExcept={!y.fromMapping.includeAddresses}

                          />
                        </td>
                      }
                      {
                        y.toMapping && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                          <AddressDisplayList
                            users={y.toMapping.addresses}
                            allExcept={!y.toMapping.includeAddresses}
                            filterMint
                          />
                        </td>
                      }


                      {
                        y.initiatedByMapping && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                          <AddressDisplayList
                            users={y.initiatedByMapping.addresses}
                            allExcept={!y.initiatedByMapping.includeAddresses}
                            filterMint
                          />
                        </td>
                      }
                    </tr>
                  })}

                </table>
              </div>
            </div>

        }
      </div>

      {
        usesBadgeIds && badgeId != undefined && <p>
          <br />
          {`*Permissions were filtered to only include this badge (ID ${badgeId}).`}
        </p>
      }
    </div >
  </>
}

export const PermissionIcon = (permissionName: string, permissions: UniversalPermission[], helperMsg: string, usedFlags: UsedFlags, neverHasManager?: boolean, badgeId?: bigint,) => {

  const { hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes } = getPermissionDataSource(permissions, usedFlags, neverHasManager, badgeId);

  return <>
    <Popover color='black' className="primary-text" content={<>
      {PermissionDisplay(permissionName, permissions, helperMsg, usedFlags, neverHasManager, badgeId)}
    </>}>

      {!(hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)
        && !(hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes) &&
        !neverHasManager &&
        <>
          <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
          {hasForbiddenTimes && <StopFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />}
          <ClockCircleFilled style={{ marginLeft: 4, fontSize: 18, }} />
        </>
      }
      {
        (neverHasManager || (hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)) && <>
          <ClockCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />
        </>
      }
      {
        hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes &&
        !neverHasManager && <>
          <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
          <ClockCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
        </>
      }
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
        {!isBadgeView && <TableRow label={"Delete collection?"} value={PermissionIcon("canDeleteCollection", castActionPermissionToUniversalPermission(collection.collectionPermissions.canDeleteCollection), "", ActionPermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Archive collection?"} value={PermissionIcon("canArchiveCollection", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canArchiveCollection), "archived or not", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update contract address?"} value={PermissionIcon("canUpdateContractAddress", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateContractAddress), "contract address", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update standards?"} value={PermissionIcon("canUpdateStandards", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateStandards), "standards", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update custom data?"} value={PermissionIcon("canUpdateCustomData", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCustomData), "custom data", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Transfer manager?"} value={PermissionIcon("canUpdateManager", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateManager), "manager", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}
        {!isBadgeView && <TableRow label={"Update collection metadata URL?"} value={PermissionIcon("canUpdateCollectionMetadata", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionMetadata), "collection metadata", TimedUpdatePermissionUsedFlags, neverHasManager)} labelSpan={18} valueSpan={6} />}

        {/* Can Be Badge-Specific */}
        {collection.balancesType === "Off-Chain" && <TableRow label={"Update off-chain balances URL?"} value={PermissionIcon("canUpdateOffChainBalancesMetadata", castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateOffChainBalancesMetadata), "off-chain balances URL", TimedUpdatePermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {<TableRow label={"Update badge metadata URL?"} value={PermissionIcon("canUpdateBadgeMetadata", castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection.collectionPermissions.canUpdateBadgeMetadata), "badge metadata", TimedUpdateWithBadgeIdsPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {/* {collection.balancesType === "Inherited" && <TableRow label={"Update inherited balances?"} value={PermissionIcon("canUpdateInheritedBalances", castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection.collectionPermissions.canUpdateInheritedBalances), "inherited balances", TimedUpdateWithBadgeIdsPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />} */}
        {<TableRow label={"Create more badges?"} value={PermissionIcon("canCreateMoreBadges", castBalancesActionPermissionToUniversalPermission(collection.collectionPermissions.canCreateMoreBadges), "", BalancesActionPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}
        {collection.balancesType === "Standard" && <TableRow label={"Update collection-level transferability?"} value={PermissionIcon("canUpdateCollectionApprovedTransfers", castCollectionApprovedTransferPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovedTransfers), "collection approved transfers", ApprovedTransferPermissionUsedFlags, neverHasManager, badgeId)} labelSpan={18} valueSpan={6} />}

      </>
    </>
  </InformationDisplayCard>
}