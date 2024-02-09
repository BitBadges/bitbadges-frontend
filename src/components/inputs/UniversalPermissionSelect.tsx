import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { faSnowflake } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Divider, Switch } from "antd";
import { UintRange } from "bitbadgesjs-sdk";
import { UniversalPermission, getReservedAddressList, isAddressListEmpty } from "bitbadgesjs-sdk";
import { useState } from "react";
import { GenericCollectionPermissionWithDetails } from "../../bitbadges-api/utils/permissions";
import { GO_MAX_UINT_64 } from "../../utils/dates";
import { AddressListSelect } from "../address/AddressListsSelect";
import { PermissionDisplayTable, PermissionNameString } from "../collection-page/PermissionsInfo";
import IconButton from "../display/IconButton";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { getPermissionVariablesFromName } from "../tx-timelines/form-items/BeforeAfterPermission";
import { BadgeIDSelectWithSwitch } from "./BadgeIdRangesInput";
import { DateSelectWithSwitch } from "./DateRangeInput";


//Permission select w/ no guardrails for advanced view on timeline form
export function PermissionSelect({
  permissionName,
  value,
  setValue,
  collectionId
}: {
  permissionName: PermissionNameString,
  value: GenericCollectionPermissionWithDetails[]
  setValue: (value: GenericCollectionPermissionWithDetails[]) => void
  collectionId: bigint
}) {
  const { flags } = getPermissionVariablesFromName(permissionName);
  const usedFlags = flags;
  const [addIsVisible, setAddIsVisible] = useState<boolean>(false);

  const [newPermissionToAdd, setNewPermissionToAdd] = useState<UniversalPermission>({
    ...usedFlags,
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    permanentlyPermittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    permanentlyForbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    toList: getReservedAddressList("All"),
    fromList: getReservedAddressList("All"),
    initiatedByList: getReservedAddressList("All"),
    approvalIdList: getReservedAddressList("All"),
    amountTrackerIdList: getReservedAddressList("All"),
    challengeTrackerIdList: getReservedAddressList("All"),
    arbitraryValue: undefined,
  });

  const [allowed, setAllowed] = useState<boolean>(true);
  const [selectedTimes, setSelectedTimes] = useState<UintRange<bigint>[]>([{ start: 1n, end: GO_MAX_UINT_64 }]);

  return <>
    <div className="flex">
      <InformationDisplayCard title={'Added Permissions'} md={12} xs={24} sm={24} subtitle={'By default, everything is permitted but not frozen.'}>

        <br />
        <PermissionDisplayTable permissions={value} neverHasManager={false} editMode setPermissions={setValue} permissionName={permissionName} />
      </InformationDisplayCard>

      <InformationDisplayCard title={'Selected Permissions (First Match Only)'} md={12} xs={24} sm={24} subtitle={'Permissions after first match is taken into account.'}>
        <br />
        <PermissionDisplayTable permissions={value} neverHasManager={false} permissionName={permissionName} />
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
          <br />
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
          <br />
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
          <br />
          <DateSelectWithSwitch timeRanges={newPermissionToAdd.ownershipTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              ownershipTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesTimelineTimes && <InformationDisplayCard title={'Updatable Times'} md={12} xs={24} sm={24} subtitle={'This permission is for a dynamic value which can change over time. What times is the value allowed to be udpated for?'}>
          <br />
          <DateSelectWithSwitch timeRanges={newPermissionToAdd.timelineTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              timelineTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesTransferTimes && <InformationDisplayCard title={'Transfer Times'} md={12} xs={24} sm={24} subtitle={'What transfer times does this permission apply to?'}>
          <br />
          <DateSelectWithSwitch timeRanges={newPermissionToAdd.transferTimes} setTimeRanges={(x) => {
            setNewPermissionToAdd({
              ...newPermissionToAdd,
              transferTimes: x
            })
          }} />
        </InformationDisplayCard>}
        {usedFlags.usesToList && <InformationDisplayCard title={'To'} md={12} xs={24} sm={24} subtitle={'Which recipients does this permission apply to?'}>
          <br />
          <div className='flex-center'>
            <AddressListSelect
              addressList={newPermissionToAdd.toList} setAddressList={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  toList: x
                })
              }} />
          </div>
        </InformationDisplayCard>}
        {usedFlags.usesFromList && <InformationDisplayCard title={'From'} md={12} xs={24} sm={24} subtitle={'Which senders does this permission apply to?'}>
          <br /><div className='flex-center'>
            <AddressListSelect
              addressList={newPermissionToAdd.fromList} setAddressList={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  fromList: x
                })
              }} /></div>
        </InformationDisplayCard>}
        {usedFlags.usesInitiatedByList && <InformationDisplayCard title={'Approved'} md={12} xs={24} sm={24} subtitle={'Which approved users does this permission apply to?'}>
          <br /> <div className='flex-center'>
            <AddressListSelect addressList={newPermissionToAdd.initiatedByList} setAddressList={(x) => {
              setNewPermissionToAdd({
                ...newPermissionToAdd,
                initiatedByList: x
              })
            }} /></div>
        </InformationDisplayCard>}

        {usedFlags.usesApprovalIdList && <InformationDisplayCard title={'Approval ID'} md={12} xs={24} sm={24} subtitle={'Which approval IDs does this permission apply to?'}>
          <br /><div className='flex-center'>
            <AddressListSelect
              isIdSelect
              addressList={newPermissionToAdd.approvalIdList} setAddressList={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  approvalIdList: x
                })
              }} /></div>
        </InformationDisplayCard>}

        {usedFlags.usesAmountTrackerIdList && <InformationDisplayCard title={'Amount Tracker ID'} md={12} xs={24} sm={24} subtitle={'Which amount tracker IDs does this permission apply to?'}>
          <br /><div className='flex-center'>
            <AddressListSelect
              isIdSelect
              addressList={newPermissionToAdd.amountTrackerIdList} setAddressList={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  amountTrackerIdList: x
                })
              }} /></div>

        </InformationDisplayCard>}

        {usedFlags.usesChallengeTrackerIdList && <InformationDisplayCard title={'Challenge Tracker ID'} md={12} xs={24} sm={24} subtitle={'Which challenge tracker IDs does this permission apply to?'}>
          <br /><div className='flex-center'>
            <AddressListSelect
              isIdSelect
              addressList={newPermissionToAdd.challengeTrackerIdList} setAddressList={(x) => {
                setNewPermissionToAdd({
                  ...newPermissionToAdd,
                  challengeTrackerIdList: x
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
          (usedFlags.usesToList && (!newPermissionToAdd.toList || isAddressListEmpty(newPermissionToAdd.toList))) ||
          (usedFlags.usesFromList && (!newPermissionToAdd.fromList || isAddressListEmpty(newPermissionToAdd.fromList))) ||
          (usedFlags.usesInitiatedByList && (!newPermissionToAdd.initiatedByList || isAddressListEmpty(newPermissionToAdd.initiatedByList))) ||
          (usedFlags.usesApprovalIdList && (!newPermissionToAdd.approvalIdList || isAddressListEmpty(newPermissionToAdd.approvalIdList))) ||
          (usedFlags.usesAmountTrackerIdList && (!newPermissionToAdd.amountTrackerIdList || isAddressListEmpty(newPermissionToAdd.amountTrackerIdList))) ||
          (usedFlags.usesChallengeTrackerIdList && (!newPermissionToAdd.challengeTrackerIdList || isAddressListEmpty(newPermissionToAdd.challengeTrackerIdList))) ||
          selectedTimes.length == 0
        }
        onClick={() => {
          setValue([{
            badgeIds: usedFlags.usesBadgeIds ? newPermissionToAdd.badgeIds : undefined,
            timelineTimes: usedFlags.usesTimelineTimes ? newPermissionToAdd.timelineTimes : undefined,
            ownershipTimes: usedFlags.usesOwnershipTimes ? newPermissionToAdd.ownershipTimes : undefined,
            transferTimes: usedFlags.usesTransferTimes ? newPermissionToAdd.transferTimes : undefined,

            toListId: usedFlags.usesToList ? newPermissionToAdd.toList.listId : undefined,
            fromListId: usedFlags.usesFromList ? newPermissionToAdd.fromList.listId : undefined,
            initiatedByListId: usedFlags.usesInitiatedByList ? newPermissionToAdd.initiatedByList.listId : undefined,
            amountTrackerId: usedFlags.usesAmountTrackerIdList ? newPermissionToAdd.amountTrackerIdList.listId : undefined,
            challengeTrackerId: usedFlags.usesChallengeTrackerIdList ? newPermissionToAdd.challengeTrackerIdList.listId : undefined,

            toList: usedFlags.usesToList ? newPermissionToAdd.toList : undefined,
            fromList: usedFlags.usesFromList ? newPermissionToAdd.fromList : undefined,
            initiatedByList: usedFlags.usesInitiatedByList ? newPermissionToAdd.initiatedByList : undefined,
            approvalIdList: usedFlags.usesApprovalIdList ? newPermissionToAdd.approvalIdList : undefined,
            permanentlyPermittedTimes: allowed ? selectedTimes : [],
            permanentlyForbiddenTimes: allowed ? [] : selectedTimes,
          } as GenericCollectionPermissionWithDetails, ...value]);
          setAddIsVisible(false);
        }}>Add</button>
    </>
    }
  </>
}