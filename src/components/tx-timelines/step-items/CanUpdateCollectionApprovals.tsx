import { deepCopy } from "bitbadgesjs-proto";
import { CollectionApprovalPermissionWithDetails, getMintApprovals, getNonMintApprovals, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { compareObjects } from "../../../utils/compare";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { ErrDisplay } from "../../common/ErrDisplay";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { getBadgesWithUnlockedSupply } from "../../../bitbadges-api/utils/badges";

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
  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);
  const allMintAmountTrackerIds = collection ? getMintApprovals(deepCopy(collection.collectionApprovals)).map(x => x.amountTrackerId) : [];
  const allMintChallengeTrackerIds = collection ? getMintApprovals(deepCopy(collection.collectionApprovals)).map(x => x.challengeTrackerId) : [];
  const allNonMintAmountTrackerIds = collection ? getNonMintApprovals(deepCopy(collection.collectionApprovals)).map(x => x.amountTrackerId) : [];
  const allNonMintChallengeTrackerIds = collection ? getNonMintApprovals(deepCopy(collection.collectionApprovals)).map(x => x.challengeTrackerId) : [];

  const getPermissionsToSet = (idx: number, locked?: boolean) => {
    const permissions = idx >= 0 && idx <= 2 ? [{
      ...AlwaysLockedPermission,
      fromMapping: idx == 0 ? getReservedAddressMapping("All")
        : idx == 1 ? getReservedAddressMapping("!Mint") : getReservedAddressMapping("Mint"),
      fromMappingId: idx == 0 ? "All" : idx == 1 ? "!Mint" : "Mint",
    }] : []



    if (idx == 1) {
      //need to lock allwithout mint
      for (const id of allNonMintAmountTrackerIds) {
        permissions.push({
          ...AlwaysLockedPermission,
          amountTrackerId: id,
        })

        if (allMintAmountTrackerIds.find(x => x === id)) {
          setErr(new Error(`You have selected to freeze the transferability of all non-mint, but you also have a mint approval with the same amount tracker ID (${id}).`))
        }
      }

      for (const id of allNonMintChallengeTrackerIds) {
        permissions.push({
          ...AlwaysLockedPermission,
          challengeTrackerId: id,
        })

        if (allMintChallengeTrackerIds.find(x => x === id)) {
          setErr(new Error(`You have selected to freeze the transferability of all non-mint, but you also have a mint approval with the same challenge tracker ID (${id}).`))
        }
      }
    }

    if (idx == 2) {
      for (const id of allMintAmountTrackerIds) {
        permissions.push({
          ...AlwaysLockedPermission,
          amountTrackerId: id,
        })

        if (allNonMintAmountTrackerIds.find(x => x === id)) {
          setErr(new Error(`You have selected to freeze the transferability of all mint, but you also have a non-mint approval with the same amount tracker ID (${id}).`))
        }
      }

      for (const id of allMintChallengeTrackerIds) {
        permissions.push({
          ...AlwaysLockedPermission,
          challengeTrackerId: id,
        })

        if (allNonMintChallengeTrackerIds.find(x => x === id)) {
          setErr(new Error(`You have selected to freeze the transferability of all mint, but you also have a non-mint approval with the same challenge tracker ID (${id}).`))
        }
      }
    }


    if (locked) {
      permissions.push(EverythingElsePermanentlyPermittedPermission)
    }

    return permissions;
  }

  const handleSwitchChange = (idx: number, locked?: boolean) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canUpdateCollectionApprovals: getPermissionsToSet(idx, locked)
      }
    });
  }

  if (!collection) return EmptyStepItem;
  const badgesIdsWithUnlockedSupply = getBadgesWithUnlockedSupply(collection, undefined, true, 'always'); //Get badge IDs that will have unlocked supply moving forward

  const AdditionalNode = ({ idx }: { idx: number }) => {
    return <>
      <div className="flex-center">
        <PermissionsOverview
          span={24}
          collectionId={collection.collectionId}
          permissionName="canUpdateCollectionApprovals"
          onFreezePermitted={(frozen: boolean) => {
            handleSwitchChange(idx, frozen);
          }}
        />
      </div>
    </>
  }

  return {
    title: `Update transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from how badges are distributed, freezing addresses, revoking badges, etc.`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateCollectionApprovals"
      node={() => <>
        <br />
        {badgesIdsWithUnlockedSupply.length > 0 && <>
          <ErrDisplay warning err={`You have selected to be able to increment supply / create more of the following badges: ${getBadgeIdsString(badgesIdsWithUnlockedSupply)}.
              Please make sure you do not end up in a scenario where you can create new badges but cannot distribute them due to frozen transferability.`} />
          <br />
        </>}

        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Freeze All',
              message: `Freeze the transferability entirely for the collection for all badge IDs and from all addresses.`,
              isSelected: compareObjects(getPermissionsToSet(0, true), collection.collectionPermissions.canUpdateCollectionApprovals) ||
                compareObjects(getPermissionsToSet(0, false), collection.collectionPermissions.canUpdateCollectionApprovals),
              additionalNode: () => <AdditionalNode idx={0} />,
            },
            {
              title: 'Freeze Post-Mint Transferability',
              message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
              isSelected: compareObjects(getPermissionsToSet(1, true), collection.collectionPermissions.canUpdateCollectionApprovals) ||
                compareObjects(getPermissionsToSet(1, false), collection.collectionPermissions.canUpdateCollectionApprovals),
              additionalNode: () => <AdditionalNode idx={1} />
            },
            {
              title: 'Freeze Mint Transferability',
              message: `Freeze the transferability of the collection for all transfers from the Mint address.`,
              isSelected: compareObjects(getPermissionsToSet(2, true), collection.collectionPermissions.canUpdateCollectionApprovals) ||
                compareObjects(getPermissionsToSet(2, false), collection.collectionPermissions.canUpdateCollectionApprovals),
              additionalNode: () => <AdditionalNode idx={2} />
            },
            {
              title: 'Editable',
              message: `The manager will be able to edit the collection-level transferability for everything. This permission can be disabled in the future.`,
              isSelected: compareObjects(getPermissionsToSet(3, true), collection.collectionPermissions.canUpdateCollectionApprovals) ||
                compareObjects(getPermissionsToSet(3, false), collection.collectionPermissions.canUpdateCollectionApprovals),
              additionalNode: () => <AdditionalNode idx={3} />
            },
          ]}
          onSwitchChange={(idx) => {
            handleSwitchChange(idx, false);
          }}
        />
      </>
      }
    />
    ,
    disabled: !!err,
  }
}