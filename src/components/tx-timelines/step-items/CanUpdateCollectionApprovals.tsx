import { InfoCircleOutlined } from "@ant-design/icons";
import { ApprovalPermissionUsedFlags, CollectionApprovalPermissionWithDetails, castCollectionApprovalPermissionToUniversalPermission, getReservedAddressMapping, isInAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { getBadgesWithUnlockedSupply } from "./CanUpdateMetadata";
import { isCompletelyForbidden } from "./CanUpdateOffChainBalancesStepItem";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.

const EverythingElsePermanentlyPermittedPermission: CollectionApprovalPermissionWithDetails<bigint> = {
  fromMapping: getReservedAddressMapping("All"),
  fromMappingId: "All",
  toMapping: getReservedAddressMapping("All"),
  toMappingId: "All",
  initiatedByMapping: getReservedAddressMapping("All"),
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
  fromMapping: getReservedAddressMapping("All"),
  fromMappingId: "All",
  toMapping: getReservedAddressMapping("All"),
  toMappingId: "All",
  initiatedByMapping: getReservedAddressMapping("All"),
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
  const collection = collections.getCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);
  const [lastClickedIdx, setLastClickedIdx] = useState<number>(-1);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const badgesIdsWithUnlockedSupply = getBadgesWithUnlockedSupply(collection, undefined, true); //Get badge IDs that will have unlocked supply moving forward

  const permissionDetails = getPermissionDetails(castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals), ApprovalPermissionUsedFlags, neverHasManager(collection));

  const handleSwitchChange = (idx: number, locked?: boolean) => {
    const permissions = idx >= 0 && idx <= 2 ? [{
      ...AlwaysLockedPermission,
      fromMapping: idx == 0 ? getReservedAddressMapping("AllWithMint")
        : idx == 1 ? getReservedAddressMapping("AllWithoutMint") : getReservedAddressMapping("Mint"),
      fromMappingId: idx == 0 ? "AllWithMint" : idx == 1 ? "AllWithoutMint" : "Mint",
    }] : []

    if (locked) {
      permissions.push(EverythingElsePermanentlyPermittedPermission)
    }

    collections.updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
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

  const completelyFrozen = isCompletelyForbidden(permissionDetails);
  const mintPermissionDetails = getPermissionDetails(
    castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals).filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, 'Mint')),
    ApprovalPermissionUsedFlags,
    neverHasManager(collection),
  )
  const nonMintPermissionDetails = getPermissionDetails(
    castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals).filter(x => x.fromMapping && !isInAddressMapping(x.fromMapping, 'Mint')),
    ApprovalPermissionUsedFlags,
    neverHasManager(collection),
  )

  const mintFrozen = !completelyFrozen && isCompletelyForbidden(mintPermissionDetails);
  const nonMintFrozen = !completelyFrozen && !mintFrozen && isCompletelyForbidden(nonMintPermissionDetails);

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
          {badgesIdsWithUnlockedSupply.length > 0 && <>
            <div className='primary-text' style={{ color: 'orange', textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} /> Note that you have selected to be able to create more of the following badges: {getBadgeIdsString(badgesIdsWithUnlockedSupply)}.
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