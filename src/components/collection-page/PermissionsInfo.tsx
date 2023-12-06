import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, InfoCircleOutlined, LockOutlined, QuestionCircleFilled } from "@ant-design/icons";
import { faSnowflake } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, Switch } from "antd";
import { AddressMapping, UintRange } from "bitbadgesjs-proto";
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, GetFirstMatchOnly, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UniversalPermission, UniversalPermissionDetails, UsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission, getCurrentValuesForCollection, getReservedAddressMapping, isInAddressMapping, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';

import { useState } from "react";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { neverHasManager } from "../../bitbadges-api/utils/manager";
import { getBadgeIdsString } from "../../utils/badgeIds";
import { compareObjects } from "../../utils/compare";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { AfterPermission } from "../tx-timelines/form-items/BeforeAfterPermission";



export function getPermissionDetails(permissions: UniversalPermission[], usedFlags: UsedFlags, neverHasManager: boolean, badgeIds?: UintRange<bigint>[]) {

  const { usesBadgeIds, usesTimelineTimes, usesTransferTimes, usesToMapping, usesFromMapping, usesInitiatedByMapping, usesOwnershipTimes, usesAmountTrackerIdMapping, usesChallengeTrackerIdMapping } = usedFlags;
  const hideIfFull = true;
  let columns = [{
    title: 'Allowed?',
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
    title: 'Times',
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
    amountTrackerIdMapping?: AddressMapping,
    challengeTrackerIdMapping?: AddressMapping,
    forbidden: boolean,
    permitted: boolean,
    permissionTimes: UintRange<bigint>[],
  }[] = [];

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
        const [, removed] = removeUintRangeFromUintRange(badgeIds ?? [{ start: 1n, end: GO_MAX_UINT_64 }], badgeIds);

        return <>{getBadgeIdsString(removed)}</>
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



  if (usesAmountTrackerIdMapping) {
    columns.push({
      title: 'Amount Tracker ID',
      dataIndex: 'amountTrackerId',
      key: 'amountTrackerIdMapping',
      render: (amountTrackerId: any) => {
        return <>{amountTrackerId}</>
      }
    })
  }

  if (usesChallengeTrackerIdMapping) {
    columns.push({
      title: 'Challenge Tracker ID',
      dataIndex: 'challengeTrackerId',
      key: 'challengeTrackerIdMapping',
      render: (challengeTrackerId: any) => {
        return <>{challengeTrackerId}</>
      }
    })
  }


  let hasNeutralTimes = false;
  let hasPermittedTimes = false;
  let hasForbiddenTimes = false;
  const firstMatchDetails = GetFirstMatchOnly(permissions, true, usedFlags);

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
        dataSource.push({
          permitted: false,
          forbidden: true,
          permissionTimes: match.forbiddenTimes,
          ...base
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

  return { columns, dataSource, hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes, neverHasManager }
}


export const PermissionDisplay = (
  { permissions, usedFlags, neverHasManager, badgeIds, mintOnly, nonMintOnly, onFreezePermitted }: {
    permissions: UniversalPermission[],
    usedFlags: UsedFlags,
    neverHasManager: boolean,
    badgeIds?: UintRange<bigint>[],
    mintOnly?: boolean,
    nonMintOnly?: boolean,
    onFreezePermitted?: (frozen: boolean) => void
  }) => {

  const { usesBadgeIds } = usedFlags;

  const { columns, dataSource } = getPermissionDetails(permissions, usedFlags, neverHasManager, badgeIds);
  const hasPermitted = dataSource.find(x => !x.forbidden)
  const hasForbidden = dataSource.find(x => x.forbidden && !x.permitted);
  const hasBothPermittedAndForbidden = hasPermitted && hasForbidden;

  const [showForbidden, setShowForbidden] = useState<boolean>(!hasPermitted ? true : false)

  dataSource.sort((a) => {
    return a.forbidden ? 1 : -1;
  })


  return <>
    <div className='full-width primary-text' style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', }}>
      <div className="" style={{ alignItems: 'normal', width: '100%' }}>
        {
          neverHasManager ? <p>
            <InfoCircleOutlined />
            {` There is and will never be a manager for this collection, so this permission can never be executed.`}
          </p> :

            <div style={{ textAlign: 'center' }} className='primary-text flex-center '>
              {/* <Typography.Text strong style={{ fontSize: 20, textAlign: 'center' }} className='primary-text'>{question} </Typography.Text> */}
              {/* <br /> */}
              <br />

              <div className="primary-text" style={{ textAlign: 'center', overflow: 'auto' }}>
                <div>

                  <table className="table-auto overflow-x-scroll">
                    {hasBothPermittedAndForbidden && <>
                      <tr>
                        <td colSpan={1000}>

                          <div style={{ float: 'right' }}>
                            <Switch
                              checked={showForbidden}
                              onChange={(checked) => {
                                setShowForbidden(checked);
                              }}
                              checkedChildren={<>Show Forbidden</>}
                              unCheckedChildren={<>Show Permitted Only</>}
                            />

                          </div>
                        </td>
                      </tr>
                      <br />
                    </>}

                    < tr className="primary-border">
                      {columns.map((x, idx) => {
                        return <td key={x.key} style={{
                          padding: 8, fontWeight: 'bold', fontSize: 16,
                          borderRight: idx === 2 && columns.length > 3 ? '1px solid' : undefined,
                          verticalAlign: 'top', minWidth: 70

                        }}>{x.title}</td>
                      })}
                    </tr>
                    {/* <tr style={{  border: '1px solid', borderTop: 'none' }}>
                <td colSpan={3} style={{ padding: 8, fontWeight: 'bold', fontSize: 12, borderRight: '1px solid' }}>Can the manager execute this permission? When?</td>


                <td colSpan={columns.length - 3} style={{ padding: 8, fontWeight: 'bold', fontSize: 12 }}>For what values?</td>

              </tr> */}

                    {dataSource.map((y, idx) => {

                      if (y.forbidden && !showForbidden) {
                        return null;
                      }

                      if ((mintOnly && (!y.fromMapping || !isInAddressMapping(y.fromMapping, "Mint")))) {
                        return null;
                      }

                      if (nonMintOnly && (compareObjects(y.fromMapping?.addresses, ["Mint"] && y.fromMapping?.includeAddresses))) {
                        return null;
                      }

                      if (mintOnly) {
                        y.fromMapping = getReservedAddressMapping("Mint")
                      }

                      if (badgeIds) {
                        const [, removed] = removeUintRangeFromUintRange(badgeIds, y.badgeIds ?? []);
                        y.badgeIds = removed;
                      }

                      //we previously may have filtered out columns, here we should not display them
                      const columnKeys = columns.map(x => x.key);

                      //delete everything from y that doesn't have a corresponding column
                      for (const key of Object.keys(y)) {
                        if (key == 'permitted' || key == 'forbidden' || key == 'permissionTimes') continue;
                        if (!columnKeys.includes(key)) {
                          delete y[key as keyof typeof y];
                        }
                      }



                      return <tr key={idx} className="primary-border">

                        {y.forbidden && !y.permitted && <>
                          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}><CloseCircleFilled style={{ color: 'red' }} /> </td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                            <div className="flex-center">
                              {onFreezePermitted ?
                                <Switch
                                  style={{ marginRight: 8 }}
                                  checked={true}
                                  checkedChildren={<FontAwesomeIcon icon={faSnowflake} />}
                                  disabled

                                /> :
                                <FontAwesomeIcon icon={faSnowflake} />}


                            </div>
                          </td></>}
                        {y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}><CheckCircleFilled style={{ color: 'green' }} /></td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                          <div className="flex-center" onClick={(e) => { e.stopPropagation(); }}>
                            {onFreezePermitted ?
                              <Switch
                                style={{ marginRight: 8 }}
                                checked={true}
                                checkedChildren={<FontAwesomeIcon icon={faSnowflake} />}

                                onChange={() => {
                                  onFreezePermitted?.(false)
                                }}
                              /> : <FontAwesomeIcon icon={faSnowflake} />}

                          </div></td></>}
                        {!y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}><CheckCircleFilled style={{ color: 'green' }} /> </td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                          <div className="flex-center" onClick={(e) => { e.stopPropagation(); }}>
                            {onFreezePermitted ?
                              <Switch
                                style={{ marginRight: 8 }}
                                checked={false}
                                unCheckedChildren={<>No</>}
                                onChange={() => {
                                  onFreezePermitted?.(true)
                                }}
                              /> : <>No</>}

                          </div></td></>}
                        {y.permissionTimes && <td style={{
                          padding: 8, fontWeight: 'bold', fontSize: 16,
                          borderRight: columns.length > 3 ? '1px solid' : undefined
                        }}>{getTimeRangesElement(y.permissionTimes, '', true, false, false)}
                        </td>
                        }

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
                        {y.timelineTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.timelineTimes, '', true, false, false)}</td>}
                        {y.badgeIds && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getBadgeIdsString(y.badgeIds)}</td>}
                        {y.ownershipTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.ownershipTimes, '', true, false, false)}</td>}
                        {y.transferTimes && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.transferTimes, '', true, false, false)}</td>}


                        {
                          y.amountTrackerIdMapping && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                            <AddressDisplayList
                              users={y.amountTrackerIdMapping.addresses}
                              allExcept={!y.amountTrackerIdMapping.includeAddresses}
                              filterMint
                              trackerIdList
                            />
                          </td>
                        }

                        {
                          y.challengeTrackerIdMapping && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
                            <AddressDisplayList
                              users={y.challengeTrackerIdMapping.addresses}
                              allExcept={!y.challengeTrackerIdMapping.includeAddresses}
                              filterMint
                              trackerIdList
                            />
                          </td>
                        }
                      </tr>
                    })}

                  </table>
                </div>
              </div>

            </div>


        }
      </div >
      {
        onFreezePermitted &&
        <>
          <br />
          <div className="full-width">

            <InfoCircleOutlined style={{ marginRight: 4 }} /> If a value is frozen, it is non-updatable and can NEVER be updated in the future.
          </div>
        </>
      }


      {
        columns.find(x => x.key === 'amountTrackerIdMapping' || x.key === 'challengeTrackerIdMapping') &&
        <>
          <br />
          <div className="full-width">

            <InfoCircleOutlined style={{ marginRight: 4 }} /> Amount tracker IDs and the challenge tracker ID are used for locking specific approvals / transferability.
          </div>
        </>
      }

      {
        usesBadgeIds && badgeIds != undefined && <p>
          <br />
          {`*Permissions were filtered to only include certain badges (${getBadgeIdsString(badgeIds)}).`}
        </p>
      }
    </div >
  </>
}

export const PermissionIcon = ({ permissions, usedFlags, neverHasManager, badgeIds }: { permissions: UniversalPermission[], usedFlags: UsedFlags, neverHasManager: boolean, badgeIds?: UintRange<bigint>[] }) => {


  const { hasPermittedTimes, hasNeutralTimes, hasForbiddenTimes } = getPermissionDetails(permissions, usedFlags, neverHasManager, badgeIds);

  return <>
    <Popover color='black' className="primary-text inherit-bg" content={<>
      <div className="dark primary-text">
        <PermissionDisplay permissions={permissions} usedFlags={usedFlags} neverHasManager={neverHasManager} badgeIds={badgeIds} />
      </div>
    </>}>

      {!(hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)
        && !(hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes) &&
        !neverHasManager &&
        <>
          <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
          {hasForbiddenTimes && <CloseCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />}
          <ClockCircleFilled style={{ marginLeft: 4, fontSize: 18, }} />
        </>
      }
      {
        (neverHasManager || (hasForbiddenTimes && !hasNeutralTimes && !hasPermittedTimes)) && <>
          <CloseCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />
          {/* <FontAwesomeIcon icon={faSnowflake} style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> */}
        </>
      }
      {
        hasPermittedTimes && !hasNeutralTimes && !hasForbiddenTimes &&
        !neverHasManager && <>
          <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
          {/* <FontAwesomeIcon icon={faSnowflake} style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> */}
        </>
      }
    </Popover >
  </>
}


export function UserPermissionsOverview({
  collectionId,
  addressOrUsername,
  displayDefaults,
}: {
  collectionId: bigint
  addressOrUsername: string,
  displayDefaults?: boolean
}) {
  const collection = useCollection(collectionId);
  const account = useAccount(addressOrUsername);
  const permissions = displayDefaults ? collection?.defaultUserPermissions : collection?.owners.find(x => x.cosmosAddress === account?.cosmosAddress)?.userPermissions;
  if (!permissions || !account) return <></>

  const incomingToCollectionCasted = castUserIncomingApprovalPermissionToCollectionApprovalPermission(permissions.canUpdateIncomingApprovals, account.address);
  const outgoingToCollectionCasted = castUserOutgoingApprovalPermissionToCollectionApprovalPermission(permissions.canUpdateOutgoingApprovals, account.address);

  return <InformationDisplayCard title={'User Permissions'} md={12} xs={24} sm={24}>
    {<TableRow label={"Update incoming approvals?"} value={
      <PermissionIcon permissions={castCollectionApprovalPermissionToUniversalPermission(incomingToCollectionCasted)} usedFlags={ApprovalPermissionUsedFlags} neverHasManager={false} />} labelSpan={18} valueSpan={6} />}
    {<TableRow label={"Update outgoing approvals?"} value={
      <PermissionIcon permissions={castCollectionApprovalPermissionToUniversalPermission(outgoingToCollectionCasted)} usedFlags={ApprovalPermissionUsedFlags} neverHasManager={false} />} labelSpan={18} valueSpan={6} />}
    {<TableRow label={"Update auto-approve self-initiated transfers (incoming)?"} value={
      <PermissionIcon permissions={castActionPermissionToUniversalPermission(permissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers)} usedFlags={ActionPermissionUsedFlags} neverHasManager={false} />} labelSpan={18} valueSpan={6} />}
    {<TableRow label={"Update auto-approve self-initiated transfers (outgoing)?"} value={
      <PermissionIcon permissions={castActionPermissionToUniversalPermission(permissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers)} usedFlags={ActionPermissionUsedFlags} neverHasManager={false} />} labelSpan={18} valueSpan={6} />}

  </InformationDisplayCard>
}

export function PermissionsOverview({
  collectionId,
  span,
  badgeId,
  tbd,
  permissionName,
  onFreezePermitted
}: {
  collectionId: bigint
  span?: number
  badgeId?: bigint,
  tbd?: boolean
  permissionName?: string
  onFreezePermitted?: (frozen: boolean) => void
}) {

  const collection = useCollection(collectionId);

  if (!collection?.collectionPermissions) return <></>

  const noManager = neverHasManager(collection);

  const isBadgeView = badgeId !== undefined;
  const badgeIds = isBadgeView ? [{ start: badgeId, end: badgeId }] : undefined;
  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No Balances");

  return <InformationDisplayCard title={permissionName ? '' : 'Manager Permissions'} span={span}>
    {(!permissionName || permissionName == "canCreateMoreBadges") && <TableRow label={"Create more badges?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castBalancesActionPermissionToUniversalPermission(collection.collectionPermissions.canCreateMoreBadges)} usedFlags={BalancesActionPermissionUsedFlags} neverHasManager={noManager} badgeIds={badgeIds} />} labelSpan={18} valueSpan={6} />}
    {!noBalancesStandard && (!permissionName || permissionName == "canUpdateCollectionApprovals") && collection.balancesType === "Standard" && <TableRow label={"Update collection transferability (including mints)?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals)} usedFlags={ApprovalPermissionUsedFlags} neverHasManager={noManager} badgeIds={badgeIds} />} labelSpan={18} valueSpan={6} />}
    {!noBalancesStandard && (!permissionName || permissionName == "canUpdateOffChainBalancesMetadata") && collection.balancesType === "Off-Chain" && <TableRow label={"Update off-chain balances URL?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateOffChainBalancesMetadata)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} badgeIds={badgeIds} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canUpdateBadgeMetadata") && <TableRow label={"Update badge metadata URL?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection.collectionPermissions.canUpdateBadgeMetadata)} usedFlags={TimedUpdateWithBadgeIdsPermissionUsedFlags} neverHasManager={noManager} badgeIds={badgeIds} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canUpdateCollectionMetadata") && !isBadgeView && <TableRow label={"Update collection metadata URL?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionMetadata)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canDeleteCollection") && !isBadgeView && <TableRow label={"Delete collection?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castActionPermissionToUniversalPermission(collection.collectionPermissions.canDeleteCollection)} usedFlags={ActionPermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canArchiveCollection") && !isBadgeView && <TableRow label={"Archive collection?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canArchiveCollection)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canUpdateStandards") && !isBadgeView && <TableRow label={"Update standards?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateStandards)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canUpdateCustomData") && !isBadgeView && <TableRow label={"Update custom data?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateCustomData)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}
    {(!permissionName || permissionName == "canUpdateManager") && !isBadgeView && <TableRow label={"Transfer manager?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateManager)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} />} labelSpan={18} valueSpan={6} />}

    {permissionName && <>
      <br />
      <AfterPermission permissionName={permissionName} onFreezePermitted={onFreezePermitted} />
    </>}
  </InformationDisplayCard>
}