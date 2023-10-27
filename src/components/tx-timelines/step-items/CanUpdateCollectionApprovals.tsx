import { InfoCircleOutlined } from "@ant-design/icons";
import { CollectionApprovalPermissionWithDetails, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { getBadgesWithUnlockedSupply } from "./CanUpdateMetadata";

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
  const [lastClickedFrozen, setLastClickedFrozen] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number>(3);
  const [err, setErr] = useState<Error | null>(null);
  const allMintAmountTrackerIds = collection ? getMintApprovals(collection).map(x => x.amountTrackerId) : [];
  const allMintChallengeTrackerIds = collection ? getMintApprovals(collection).map(x => x.challengeTrackerId) : [];
  const allNonMintAmountTrackerIds = collection ? getNonMintApprovals(collection).map(x => x.amountTrackerId) : [];
  const allNonMintChallengeTrackerIds = collection ? getNonMintApprovals(collection).map(x => x.challengeTrackerId) : [];



  const allIdsString = JSON.stringify(allMintAmountTrackerIds) + JSON.stringify(allMintChallengeTrackerIds) + JSON.stringify(allNonMintAmountTrackerIds) + JSON.stringify(allNonMintChallengeTrackerIds);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("FreezeSelectStepItem", { allMintAmountTrackerIds, allMintChallengeTrackerIds, allNonMintAmountTrackerIds, allNonMintChallengeTrackerIds })
    handleSwitchChange(lastClickedIdx, lastClickedFrozen);
  }, [allIdsString])


  if (!collection) return EmptyStepItem;

  const badgesIdsWithUnlockedSupply = getBadgesWithUnlockedSupply(collection, undefined, true); //Get badge IDs that will have unlocked supply moving forward


  const getPermissionsToSet = (idx: number, locked?: boolean) => {
    const permissions = idx >= 0 && idx <= 2 ? [{
      ...AlwaysLockedPermission,
      fromMapping: idx == 0 ? getReservedAddressMapping("AllWithMint")
        : idx == 1 ? getReservedAddressMapping("AllWithoutMint") : getReservedAddressMapping("Mint"),
      fromMappingId: idx == 0 ? "AllWithMint" : idx == 1 ? "AllWithoutMint" : "Mint",
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


    collections.updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canUpdateCollectionApprovals: getPermissionsToSet(idx, locked)
      }
    });

    setSelectedIdx(idx);
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
            setLastClickedFrozen(frozen);
          }}
        />
      </div>
    </>
  }

  // const completelyFrozen = isCompletelyForbidden(permissionDetails);
  // const mintPermissionDetails = getPermissionDetails(
  //   castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals).filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, 'Mint')),
  //   ApprovalPermissionUsedFlags,
  //   neverHasManager(collection),
  // )
  // const nonMintPermissionDetails = getPermissionDetails(
  //   castCollectionApprovalPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovals).filter(x => x.fromMapping && x.fromMapping.includeAddresses && x.fromMapping.addresses.length == 1 && x.fromMapping.addresses[0] === 'Mint'),
  //   ApprovalPermissionUsedFlags,
  //   neverHasManager(collection),
  // )

  // const mintFrozen = !completelyFrozen && isCompletelyForbidden(mintPermissionDetails);
  // const nonMintFrozen = !completelyFrozen && !mintFrozen && isCompletelyForbidden(nonMintPermissionDetails);

  // const nonMintFrozenButMintUnfrozen = !completelyFrozen && nonMintFrozen && !mintFrozen;
  // const mintFrozenButNonMintUnfrozen = !completelyFrozen && mintFrozen && !nonMintFrozen;

  // const completelyPermitted = !permissionDetails.hasForbiddenTimes

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
            <div className='' style={{ color: 'orange', textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} /> You have selected to be able to increment supply / create more of the following badges: {getBadgeIdsString(badgesIdsWithUnlockedSupply)}.
              Please make sure the transferability of these badges is either a) set to not frozen or b) you pre-handled the future transferability for these badges when you previously selected transferability.

            </div>
            <br />
          </>}

          <SwitchForm
            showCustomOption
            fullWidthCards
            options={[
              {
                title: 'Freeze All',
                message: `Freeze the transferability entirely for the collection for all badge IDs and from all addresses.`,
                isSelected: selectedIdx === 0,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Freeze Post-Mint Transferability',
                message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
                isSelected: selectedIdx === 1,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Freeze Mint Transferability',
                message: `Freeze the transferability of the collection for all transfers from the Mint address.`,
                isSelected: selectedIdx === 2,
                additionalNode: <AdditionalNode />
              },
              {
                title: 'Editable',
                message: `The manager will be able to edit the collection-level transferability for everything. This permission can be disabled in the future.`,
                isSelected: selectedIdx === 3,
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