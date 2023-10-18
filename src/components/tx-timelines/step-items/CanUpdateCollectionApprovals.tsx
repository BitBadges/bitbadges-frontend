import { InfoCircleOutlined } from "@ant-design/icons";
import { AddressMapping } from "bitbadgesjs-proto";
import { ApprovalPermissionUsedFlags, CollectionApprovalPermissionWithDetails, castCollectionApprovalPermissionToUniversalPermission, getReservedAddressMapping, invertUintRanges, isInAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.


const EverythingElsePermanentlyPermittedPermission: CollectionApprovalPermissionWithDetails<bigint> = {
  fromMapping: getReservedAddressMapping("All") as AddressMapping,
  fromMappingId: "All",
  toMapping: getReservedAddressMapping("All") as AddressMapping,
  toMappingId: "All",
  initiatedByMapping: getReservedAddressMapping("All") as AddressMapping,
  initiatedByMappingId: "All",
  amountTrackerId: "All",
  challengeTrackerId: "All",
  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  forbiddenTimes: [],
}

const AlwaysLockedPermission: CollectionApprovalPermissionWithDetails<bigint> = {
  fromMapping: getReservedAddressMapping("All") as AddressMapping,
  fromMappingId: "All",
  toMapping: getReservedAddressMapping("All") as AddressMapping,
  toMappingId: "All",
  initiatedByMapping: getReservedAddressMapping("All") as AddressMapping,
  initiatedByMappingId: "All",
  amountTrackerId: "All",
  challengeTrackerId: "All",
  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  permittedTimes: [],
  forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
}

export function FreezeSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);
  const [lastClickedIdx, setLastClickedIdx] = useState<number>(-1);

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const lockedBadgeIds = collection.collectionPermissions.canCreateMoreBadges.length > 0 ? collection.collectionPermissions.canCreateMoreBadges.map(x => x.badgeIds).flat() : [];
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  const permissionDetails = getPermissionDetails(castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals), ApprovalPermissionUsedFlags);

  const overallHasPermittedTimes = permissionDetails.dataSource.some(x => x.permitted);
  const overallHasForbiddenTimes = permissionDetails.dataSource.some(x => x.forbidden);
  const overallHasNeutralTimes = permissionDetails.dataSource.some(x => !x.permitted && !x.forbidden);

  const mintPermissionDetails = permissionDetails.dataSource.filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, "Mint"));
  const mintHasPermittedTimes = mintPermissionDetails.some(x => x.permitted);
  const mintHasForbiddenTimes = mintPermissionDetails.some(x => x.forbidden);
  const mintHasNeutralTimes = mintPermissionDetails.some(x => !x.permitted && !x.forbidden);

  const handleSwitchChange = (idx: number, locked?: boolean) => {
    const permissions = idx >= 0 && idx <= 2 ? [{
      ...AlwaysLockedPermission,
      fromMapping: idx == 0 ? getReservedAddressMapping("AllWithMint") as AddressMapping
        : idx == 1 ? getReservedAddressMapping("AllWithoutMint") as AddressMapping : getReservedAddressMapping("Mint") as AddressMapping,
      fromMappingId: idx == 0 ? "AllWithMint" : idx == 1 ? "AllWithoutMint" : "Mint",
    }] : []

    if (locked) {
      permissions.push(EverythingElsePermanentlyPermittedPermission)
    }

    collections.updateCollection({
      ...collection,
      collectionPermissions: {
        ...collection.collectionPermissions,
        canUpdateCollectionApprovals: permissions
      }
    });
  }


  const AdditionalNode = () => {
    return <>
      <div className="flex-center">
        <PermissionsOverview
          span={24}
          collectionId={collection.collectionId}
          permissionName="canUpdateCollectionApprovals"
          onFreezePermitted={(frozen: boolean) => {
            handleSwitchChange(lastClickedIdx, frozen);
          }}
        />
      </div>
    </>
  }

  const completelyFrozen = overallHasForbiddenTimes && !overallHasNeutralTimes && !overallHasPermittedTimes;
  const mintFrozen = mintHasForbiddenTimes && !mintHasNeutralTimes && !mintHasPermittedTimes;
  const nonMintFrozen = !completelyFrozen && !mintFrozen && overallHasForbiddenTimes;

  const nonMintFrozenButMintUnfrozen = !completelyFrozen && nonMintFrozen && !mintFrozen;
  const mintFrozenButNonMintUnfrozen = !completelyFrozen && mintFrozen && !nonMintFrozen;

  return {
    title: `Update transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from how badges are distributed, freezing addresses, revoking badges, etc.`,
    node:
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canUpdateCollectionApprovals"
        node={<>
          <br />
          {unlockedBadgeIds.length > 0 && <>
            <div className='primary-text' style={{ color: 'orange', textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} /> Note that you have selected to be able to create more of the following badges: {getBadgeIdsString(unlockedBadgeIds)}.
              Please make sure the transferability of these badges is either a) set to not frozen or b) pre-handled via the previously selected transferability.

            </div>
            <br />
          </>}

          <SwitchForm
            showCustomOption
            options={[
              {
                title: 'Freeze All',
                message: `Freeze the transferability entirely for the collection for all badge IDs and from all addresses.`,
                isSelected: completelyFrozen,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Freeze Post-Mint Transferability',
                message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
                isSelected: nonMintFrozenButMintUnfrozen,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Freeze Mint Transferability',
                message: `Freeze the transferability of the collection for all transfers from the Mint address.`,
                isSelected: mintFrozenButNonMintUnfrozen,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Editable',
                message: `The manager will be able to edit the collection-level transferability for everything. This permission can be disabled in the future.`,
                isSelected: !permissionDetails.hasForbiddenTimes,
                additionalNode: <AdditionalNode />
              },
            ]}
            onSwitchChange={(idx) => {
              if (lastClickedIdx !== idx) {
                setLastClickedIdx(idx)
                handleSwitchChange(idx, false);
              }
            }}

          />

        </>
        }
      />
    ,
    disabled: !!err,
  }
}