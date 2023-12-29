import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, DeleteOutlined, DownOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, QuestionCircleFilled, UpOutlined } from "@ant-design/icons";
import { faSnowflake } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, Switch } from "antd";
import { AddressMapping, UintRange, deepCopy } from "bitbadgesjs-proto";
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, GetFirstMatchOnly, GetMappingWithOptions, GetUintRangesWithOptions, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UniversalPermission, UniversalPermissionDetails, UsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission, getCurrentValuesForCollection, getReservedAddressMapping, isAddressMappingEmpty, isFullUintRanges, isInAddressMapping, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';

import { useState } from "react";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { neverHasManager } from "../../bitbadges-api/utils/manager";
import { getBadgeIdsString } from "../../utils/badgeIds";
import { compareObjects } from "../../utils/compare";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../utils/dates";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { AddressMappingSelect } from "../address/AddressMappingSelect";
import { Divider } from "../display/Divider";
import IconButton from "../display/IconButton";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { BadgeIdRangesInput } from "../inputs/BadgeIdRangesInput";
import { DateRangeInput } from "../inputs/DateRangeInput";
import { AfterPermission } from "../tx-timelines/form-items/BeforeAfterPermission";

export function getPermissionDetails(permissions: UniversalPermission[], usedFlags: UsedFlags, neverHasManager: boolean, badgeIds?: UintRange<bigint>[], doNotMerge?: boolean) {
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

export interface PermissionDetails {
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
}

export interface GenericCollectionPermission {
  timelineTimes?: UintRange<bigint>[],
  badgeIds?: UintRange<bigint>[],
  ownershipTimes?: UintRange<bigint>[],
  transferTimes?: UintRange<bigint>[],
  toMapping?: AddressMapping,
  fromMapping?: AddressMapping,
  initiatedByMapping?: AddressMapping,
  amountTrackerIdMapping?: AddressMapping,
  challengeTrackerIdMapping?: AddressMapping,
  forbiddenTimes?: UintRange<bigint>[],
  permittedTimes?: UintRange<bigint>[],

  toMappingId?: string,
  fromMappingId?: string,
  initiatedByMappingId?: string,
  amountTrackerId?: string,
  challengeTrackerId?: string,
}


export const PermissionTableRow = ({ permission, columns, onFreezePermitted, setPermissions, idx, permissions }: {
  permission: PermissionDetails,
  columns: {
    title: string,
    dataIndex: string,
    key: string,
    render?: (x: any) => JSX.Element
  }[],
  onFreezePermitted?: (frozen: boolean) => void
  setPermissions?: (permissions: GenericCollectionPermission[]) => void,
  idx?: number
  permissions?: GenericCollectionPermission[]
}) => {
  const y = permission;

  return <tr className="primary-border">
    {!!setPermissions && permissions && idx !== undefined && < td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{idx + 1}</td>}
    {!!setPermissions && permissions && idx !== undefined && < td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
      <div className="flex">
        {idx > 0 && idx != permissions.length && < IconButton src={<UpOutlined />} onClick={() => {
          const newPermissions = [...permissions];
          const temp = newPermissions[idx];
          newPermissions[idx] = newPermissions[idx - 1];
          newPermissions[idx - 1] = temp;
          setPermissions?.(newPermissions);
        }} text="Up" />}
        {idx < permissions.length - 1 && <IconButton src={<DownOutlined color="white" style={{ color: 'white' }} />} onClick={() => {
          const newPermissions = [...permissions];
          const temp = newPermissions[idx];
          newPermissions[idx] = newPermissions[idx + 1];
          newPermissions[idx + 1] = temp;
          setPermissions?.(newPermissions);
        }} text="Down" />}

        <IconButton
          disabled={idx == permissions.length}
          src={<DeleteOutlined />} onClick={() => {
            let newPermissions = [...permissions];
            // //pop off the last one ( the default one )


            newPermissions = newPermissions.filter((_, i) => i !== idx);
            setPermissions?.(newPermissions);
          }} text="Delete" />

      </div>
    </td>
    }
    {
      y.forbidden && !y.permitted && <>
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
        </td></>
    }
    {
      y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}><CheckCircleFilled style={{ color: 'green' }} /></td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
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

        </div></td></>
    }
    {
      !y.permitted && !y.forbidden && <><td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}><CheckCircleFilled style={{ color: 'green' }} /> </td> <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
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

        </div></td></>
    }
    {
      y.permissionTimes && <td style={{
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
  </tr >
}

export const PermissionDisplay = (
  { permissions, usedFlags, neverHasManager, badgeIds, mintOnly, nonMintOnly, onFreezePermitted, editMode, setAllPermissions, allPermissions }: {
    permissions: UniversalPermission[],
    usedFlags: UsedFlags,
    neverHasManager: boolean,
    badgeIds?: UintRange<bigint>[],
    mintOnly?: boolean,
    nonMintOnly?: boolean,
    onFreezePermitted?: (frozen: boolean) => void
    editMode?: boolean
    
    //all permissons are the ones to be edited
    allPermissions?: GenericCollectionPermission[],
    setAllPermissions?: (permissions: GenericCollectionPermission[]) => void
  }) => {

  const { usesBadgeIds } = usedFlags;

  const { columns, dataSource } = getPermissionDetails([...permissions], usedFlags, neverHasManager, badgeIds, editMode)
  const hasPermitted = dataSource.find(x => !x.forbidden)
  const hasForbidden = dataSource.find(x => x.forbidden && !x.permitted);
  const hasBothPermittedAndForbidden = hasPermitted && hasForbidden;

  const [showForbidden, setShowForbidden] = useState<boolean>(editMode ? true : !hasPermitted ? true : false)

  if (!editMode) {
    dataSource.sort((a) => {
      return a.forbidden ? 1 : -1;
    })
  }

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
                    {hasBothPermittedAndForbidden && !editMode && <>
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
                      {editMode && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Priority</td>}
                      {editMode && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}></td>}


                      {columns.map((x, idx) => {
                        return <td key={x.key} style={{
                          padding: 8, fontWeight: 'bold', fontSize: 16,
                          borderRight: idx === 2 && columns.length > 3 ? '1px solid' : undefined,
                          verticalAlign: 'top', minWidth: 70

                        }}>{x.title}</td>
                      })}

                    </tr>
                    {dataSource.map((y, idx) => {
                      
                      if (hasBothPermittedAndForbidden) {
                        if (y.forbidden && !showForbidden) {
                          return null;
                        }
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

                      return <PermissionTableRow key={idx}
                        idx={idx}
                        permissions={allPermissions}
                        permission={y} 
                        columns={columns} onFreezePermitted={onFreezePermitted}
                        setPermissions={setAllPermissions}
                        />
                    })}
                  </table>
                </div>
              </div>
            </div>
        }
      </div >
      {

        <>
          <br />
          <div className="full-width secondary-text">

            <InfoCircleOutlined style={{ marginRight: 4 }} /> If a value is frozen, it is non-updatable and can NEVER be updated in the future.
          </div>
        </>
      }


      {
        columns.find(x => x.key === 'amountTrackerIdMapping' || x.key === 'challengeTrackerIdMapping') &&
        <>
          <br />
          <div className="full-width secondary-text">

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
  const permissions = displayDefaults ? collection?.defaultBalances.userPermissions : collection?.owners.find(x => x.cosmosAddress === account?.cosmosAddress)?.userPermissions;
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
    {!noBalancesStandard && (!permissionName || permissionName == "canUpdateOffChainBalancesMetadata") && (collection.balancesType === "Off-Chain - Indexed" || collection.balancesType === "Off-Chain - Non-Indexed") && <TableRow label={"Update balances URL?"} value={tbd ? <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} /> : <PermissionIcon permissions={castTimedUpdatePermissionToUniversalPermission(collection.collectionPermissions.canUpdateOffChainBalancesMetadata)} usedFlags={TimedUpdatePermissionUsedFlags} neverHasManager={noManager} badgeIds={badgeIds} />} labelSpan={18} valueSpan={6} />}
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

export const BadgeIDSelectWithSwitch = ({ collectionId, uintRanges, setUintRanges }: { collectionId: bigint, uintRanges: UintRange<bigint>[], setUintRanges: (uintRanges: UintRange<bigint>[]) => void }) => {
  return <>
  <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
    
      <Switch
        checked={isFullUintRanges(uintRanges)}
        checkedChildren="All Badges"
        unCheckedChildren="Custom"
        onChange={(checked) => {
          if (checked) {
            setUintRanges([{ start: 1n, end: GO_MAX_UINT_64 }],
            );
          } else {
            setUintRanges([]);
          }
        }}
      />
      <br />
      <div className="secondary-text">
        <InfoCircleOutlined />{' '}
        {isFullUintRanges(uintRanges) && "All IDs are selected, even IDs that may have not been created yet."}
        {!isFullUintRanges(uintRanges) && "Custom IDs are selected."}
      </div>
      <br />
      <>
        {isFullUintRanges(uintRanges) ? <></> : <>

          <BadgeIdRangesInput
            uintRangeBounds={[{ start: 1n, end: GO_MAX_UINT_64 }]}
            collectionId={collectionId}
            uintRanges={uintRanges}
            setUintRanges={(uintRanges) => {
              setUintRanges(uintRanges);
            }}

          />
        </>}</>
    </div>
</>
}


export const DateSelectWithSwitch = ({ timeRanges, setTimeRanges }: { timeRanges: UintRange<bigint>[], setTimeRanges: (timeRanges: UintRange<bigint>[]) => void }) => {
  return <>
    <br />
    <div className="flex-center flex-column" style={{ textAlign: 'center' }}>
      <div>
        <Switch
          checked={isFullUintRanges(timeRanges)}
          checkedChildren="All Times"
          unCheckedChildren="Custom"
          onChange={(checked) => {
            if (checked) {
              setTimeRanges([{ start: 1n, end: GO_MAX_UINT_64 }],
              );
            } else {
              setTimeRanges([]);
            }
          }}
        />
        <br /><br />
        <div className="secondary-text">
          <InfoCircleOutlined />{' '}
          {isFullUintRanges(timeRanges) && "All times are selected."}
          {!isFullUintRanges(timeRanges) && "Custom times are selected."}
        </div>
        <br />
        <>
          {isFullUintRanges(timeRanges) ? <></> : <>

            <DateRangeInput
              timeRanges={timeRanges}
              setTimeRanges={(timeRanges) => {
                setTimeRanges(timeRanges);
              }}
            />
          </>}</>
      </div>
    </div>
  </>
}

export function PermissionSelect({
  permissionName,
  value,
  setValue,
  collectionId
}: {
  permissionName: string,
  value: GenericCollectionPermission[]
  setValue: (value: GenericCollectionPermission[]) => void
  collectionId: bigint
}) {
  let usedFlags: UsedFlags = ApprovalPermissionUsedFlags;
  let convertFunction = undefined;
  switch (permissionName) {
    case "canCreateMoreBadges":
      usedFlags = BalancesActionPermissionUsedFlags;
      convertFunction = castBalancesActionPermissionToUniversalPermission;
      break;
    case "canUpdateOffChainBalancesMetadata":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canUpdateBadgeMetadata":
      usedFlags = TimedUpdateWithBadgeIdsPermissionUsedFlags;
      convertFunction = castTimedUpdateWithBadgeIdsPermissionToUniversalPermission;
      break;
    case "canUpdateCollectionMetadata":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canDeleteCollection":
      usedFlags = ActionPermissionUsedFlags;
      convertFunction = castActionPermissionToUniversalPermission;
      break;
    case "canArchiveCollection":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canUpdateStandards":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canUpdateCustomData":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canUpdateManager":
      usedFlags = TimedUpdatePermissionUsedFlags;
      convertFunction = castTimedUpdatePermissionToUniversalPermission;
      break;
    case "canUpdateCollectionApprovals":
      usedFlags = ApprovalPermissionUsedFlags;
      convertFunction = castCollectionApprovalPermissionToUniversalPermission;
      break;
    default:
      break;
  }

  const permissions = convertFunction ? convertFunction(value as Required<GenericCollectionPermission>[]) : [];
  const [addIsVisible, setAddIsVisible] = useState<boolean>(false);

  const [newPermissionToAdd, setNewPermissionToAdd] = useState<UniversalPermission>({
    ...usedFlags,
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    toMapping: getReservedAddressMapping("All"),
    fromMapping: getReservedAddressMapping("All"),
    initiatedByMapping: getReservedAddressMapping("All"),
    amountTrackerIdMapping: getReservedAddressMapping("All"),
    challengeTrackerIdMapping: getReservedAddressMapping("All"),
    arbitraryValue: undefined,
  });

  const [allowed, setAllowed] = useState<boolean>(true);
  const [selectedTimes, setSelectedTimes] = useState<UintRange<bigint>[]>([{ start: 1n, end: GO_MAX_UINT_64 }]);

  return <>
    <div className="secondary-text" style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', }}>
      Below are all the permissions you have added. By default, everything is permitted but not frozen. We take first match only, so the priority of these permissions matters.
    </div>
    <br />

    <div className="flex">
      <InformationDisplayCard title={'Added'} md={12} xs={24} sm={24} subtitle={'All added permissions before filtering first match only. By default, everything is permitted but not frozen.'}>

        <br />
        <PermissionDisplay permissions={permissions} usedFlags={usedFlags} neverHasManager={false} editMode allPermissions={value} setAllPermissions={setValue} />
      </InformationDisplayCard>

      <InformationDisplayCard title={'Permissions (First Match Only)'} md={12} xs={24} sm={24} subtitle={'Permissions after first match is taken into account.'}>
        <br />
        <PermissionDisplay permissions={permissions} usedFlags={usedFlags} neverHasManager={false} />
      </InformationDisplayCard>
    </div>
    <Divider />
    <IconButton
      src={addIsVisible ? <MinusOutlined /> : <PlusOutlined />}
      onClick={() => {
        setAddIsVisible(!addIsVisible);
      }}
      text={addIsVisible ? 'Hide' : 'Add'}
      tooltipMessage="Add a new permission"
    />

    <br />
    {addIsVisible && <>
      <div className="flex flex-wrap" style={{ textAlign: 'center' }}>
        <InformationDisplayCard title={'Allowed?'} md={12} xs={24} sm={24} subtitle={'If allowed, the times below will be permitted. If not allowed, the times below will be forbidden.'}>
          <br/>
          <TableRow label={"Allowed?"} value={<Switch
            checked={allowed}
            onChange={(checked) => {
              setAllowed(checked);
            }}
          />} labelSpan={18} valueSpan={6} />
          <TableRow label={"Frozen?"} value={<Switch
            checked={true}
            unCheckedChildren={<>No</>}
            checkedChildren={<FontAwesomeIcon icon={faSnowflake} />}

            disabled
          />} labelSpan={18} valueSpan={6} />
          <div className="secondary-text" style={{ marginLeft: 10 }}>
            <InfoCircleOutlined /> Added permissions should always be frozen. Non-frozen disallowed permissions do not exist, and non-frozen allowed is the default.
          </div>
          <Divider />
          <DateSelectWithSwitch timeRanges={selectedTimes} setTimeRanges={(x) => {
            setSelectedTimes(x);
          }} />


        </InformationDisplayCard>
        {usedFlags.usesBadgeIds && <InformationDisplayCard title={'Badge IDs'} md={12} xs={24} sm={24} subtitle={'Select what badge IDs this permission applies to.'}>
          <br/>
          <BadgeIDSelectWithSwitch
            collectionId={collectionId}
            uintRanges={newPermissionToAdd.badgeIds} setUintRanges={(x) => {
              setNewPermissionToAdd({
                ...newPermissionToAdd,
                badgeIds: x
              })
            }}
          />
        </InformationDisplayCard>}
        {usedFlags.usesOwnershipTimes && <InformationDisplayCard title={'Ownership Times'} md={12} xs={24} sm={24} subtitle={'Which ownership times for the selected badge IDs does this permission apply to?'}>
          <br/>
          <DateSelectWithSwitch timeRanges={newPermissionToAdd.ownershipTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              ownershipTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesTimelineTimes && <InformationDisplayCard title={'Updatable Times'} md={12} xs={24} sm={24} subtitle={'This permission is for a dynamic value which can change over time. What times is the value allowed to be udpated for?'}>
        <br/>
        <DateSelectWithSwitch timeRanges={newPermissionToAdd.timelineTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              timelineTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesTransferTimes && <InformationDisplayCard title={'Transfer Times'} md={12} xs={24} sm={24} subtitle={'What transfer times does this permission apply to?'}>
          <br/>
          <DateSelectWithSwitch timeRanges={newPermissionToAdd.transferTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              transferTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesToMapping && <InformationDisplayCard title={'To'} md={12} xs={24} sm={24} subtitle={'Which recipients does this permission apply to?'}>
          <br/>
          <div className='flex-center'>
            <AddressMappingSelect 
              addressMapping={newPermissionToAdd.toMapping} setAddressMapping={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  toMapping: x
                })
              }} />
            </div>
        </InformationDisplayCard>}
        {usedFlags.usesFromMapping && <InformationDisplayCard title={'From'} md={12} xs={24} sm={24} subtitle={'Which senders does this permission apply to?'}>
        <br/><div className='flex-center'>
            <AddressMappingSelect
              addressMapping={newPermissionToAdd.fromMapping} setAddressMapping={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  fromMapping: x
                })
              }} /></div>
        </InformationDisplayCard>}
        {usedFlags.usesInitiatedByMapping && <InformationDisplayCard title={'Approved'} md={12} xs={24} sm={24} subtitle={'Which approved users does this permission apply to?'}>
        <br/> <div className='flex-center'>
            <AddressMappingSelect addressMapping={newPermissionToAdd.initiatedByMapping} setAddressMapping={(x) => {
              setNewPermissionToAdd({
                ...newPermissionToAdd,
                initiatedByMapping: x
              })
            }} /></div>
        </InformationDisplayCard>}

        {usedFlags.usesAmountTrackerIdMapping && <InformationDisplayCard title={'Amount Tracker ID'} md={12} xs={24} sm={24} subtitle={'Which amount tracker IDs does this permission apply to?'}>
        <br/><div className='flex-center'>
            <AddressMappingSelect
              isIdSelect
              addressMapping={newPermissionToAdd.amountTrackerIdMapping} setAddressMapping={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  amountTrackerIdMapping: x
                })
              }} /></div>
        </InformationDisplayCard>}
        {usedFlags.usesChallengeTrackerIdMapping && <InformationDisplayCard title={'Challenge Tracker ID'} md={12} xs={24} sm={24} subtitle={'Which challenge tracker IDs does this permission apply to?'}>
        <br/><div className='flex-center'>
            <AddressMappingSelect
              isIdSelect
              addressMapping={newPermissionToAdd.challengeTrackerIdMapping} setAddressMapping={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  challengeTrackerIdMapping: x
                })
              }} /></div>
        </InformationDisplayCard>}
      </div>
      <Divider />
      <button className="landing-button"
        style={{ width: '100%' }}
        disabled={
          (usedFlags.usesBadgeIds && (!newPermissionToAdd.badgeIds || newPermissionToAdd.badgeIds.length === 0)) ||
          (usedFlags.usesTimelineTimes && (!newPermissionToAdd.timelineTimes || newPermissionToAdd.timelineTimes.length === 0)) ||
          (usedFlags.usesOwnershipTimes && (!newPermissionToAdd.ownershipTimes || newPermissionToAdd.ownershipTimes.length === 0)) ||
          (usedFlags.usesTransferTimes && (!newPermissionToAdd.transferTimes || newPermissionToAdd.transferTimes.length === 0)) ||
          (usedFlags.usesToMapping && (!newPermissionToAdd.toMapping || isAddressMappingEmpty(newPermissionToAdd.toMapping))) ||
          (usedFlags.usesFromMapping && (!newPermissionToAdd.fromMapping || isAddressMappingEmpty(newPermissionToAdd.fromMapping))) ||
          (usedFlags.usesInitiatedByMapping && (!newPermissionToAdd.initiatedByMapping || isAddressMappingEmpty(newPermissionToAdd.initiatedByMapping))) ||
          (usedFlags.usesAmountTrackerIdMapping && (!newPermissionToAdd.amountTrackerIdMapping || isAddressMappingEmpty(newPermissionToAdd.amountTrackerIdMapping))) ||
          (usedFlags.usesChallengeTrackerIdMapping && (!newPermissionToAdd.challengeTrackerIdMapping || isAddressMappingEmpty(newPermissionToAdd.challengeTrackerIdMapping))) ||
          selectedTimes.length == 0
        }
        onClick={() => {
          setValue([{
            badgeIds: usedFlags.usesBadgeIds ? newPermissionToAdd.badgeIds : undefined,
            timelineTimes: usedFlags.usesTimelineTimes ? newPermissionToAdd.timelineTimes : undefined,
            ownershipTimes: usedFlags.usesOwnershipTimes ? newPermissionToAdd.ownershipTimes : undefined,
            transferTimes: usedFlags.usesTransferTimes ? newPermissionToAdd.transferTimes : undefined,

            toMappingId: usedFlags.usesToMapping ? newPermissionToAdd.toMapping.mappingId : undefined,
            fromMappingId: usedFlags.usesFromMapping ? newPermissionToAdd.fromMapping.mappingId : undefined,
            initiatedByMappingId: usedFlags.usesInitiatedByMapping ? newPermissionToAdd.initiatedByMapping.mappingId : undefined,
            amountTrackerId: usedFlags.usesAmountTrackerIdMapping ? newPermissionToAdd.amountTrackerIdMapping.mappingId : undefined,
            challengeTrackerId: usedFlags.usesChallengeTrackerIdMapping ? newPermissionToAdd.challengeTrackerIdMapping.mappingId : undefined,

            toMapping: usedFlags.usesToMapping ? newPermissionToAdd.toMapping : undefined,
            fromMapping: usedFlags.usesFromMapping ? newPermissionToAdd.fromMapping : undefined,
            initiatedByMapping: usedFlags.usesInitiatedByMapping ? newPermissionToAdd.initiatedByMapping : undefined,
            amountTrackerIdMapping: usedFlags.usesAmountTrackerIdMapping ? newPermissionToAdd.amountTrackerIdMapping : undefined,
            challengeTrackerIdMapping: usedFlags.usesChallengeTrackerIdMapping ? newPermissionToAdd.challengeTrackerIdMapping : undefined,
            permittedTimes: allowed ? selectedTimes : [],
            forbiddenTimes: allowed ? [] : selectedTimes,
          }, ...value]);
          setAddIsVisible(false);
        }}>Add</button>
    </>
    }
  </>
}