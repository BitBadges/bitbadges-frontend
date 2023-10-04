import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Divider, Typography } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { ApprovedTransferPermissionUsedFlags, CollectionApprovedTransferPermissionWithDetails, castCollectionApprovedTransferPermissionToUniversalPermission, getReservedAddressMapping, invertUintRanges, isInAddressMapping } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.
export function FreezeSelectStepItem() {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const showAdvancedOptions = txTimelineContext.showAdvancedOptions;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);
  const [selectedIdxs, setSelectedIdxs] = useState<number[]>([]);



  const [err, setErr] = useState<Error | null>(null);
  useEffect(() => {
    //Because this option depends on locked badges, we need to make sure the correct value is selected whenever the locked badges could potentially change
    if (selectedIdxs.includes(0)) {
      handleSwitchChange(0);
    }
  }, [collection?.collectionPermissions.canCreateMoreBadges])

  if (!collection) return EmptyStepItem;



  const lockedBadgeIds = collection.collectionPermissions.canCreateMoreBadges.length > 0 ? collection.collectionPermissions.canCreateMoreBadges.map(x => x.defaultValues.badgeIds).flat() : [];
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  const permissionDetails = getPermissionDetails(castCollectionApprovedTransferPermissionToUniversalPermission(collection.collectionPermissions.canUpdateCollectionApprovedTransfers), ApprovedTransferPermissionUsedFlags);
  const mintPermissionDetails = permissionDetails.dataSource.filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, "Mint"));
  const mintHasPermittedTimes = mintPermissionDetails.some(x => x.permitted);
  const mintHasForbiddenTimes = mintPermissionDetails.some(x => x.forbidden);
  const mintHasNeutralTimes = mintPermissionDetails.some(x => !x.permitted && !x.forbidden);

  const nonMintPermissionDetails = permissionDetails.dataSource.filter(x => x.fromMapping && !isInAddressMapping(x.fromMapping, "Mint"));
  const nonMintHasPermittedTimes = nonMintPermissionDetails.some(x => x.permitted);
  const nonMintHasForbiddenTimes = nonMintPermissionDetails.some(x => x.forbidden);
  const nonMintHasNeutralTimes = nonMintPermissionDetails.some(x => !x.permitted && !x.forbidden);

  const everythingLocked = !permissionDetails.hasNeutralTimes;



  const EverythingLockedCombination = {
    fromMappingOptions: { allValues: true },
    toMappingOptions: { allValues: true },
    initiatedByMappingOptions: { allValues: true },
    badgeIdsOptions: { allValues: true },
    ownershipTimesOptions: { allValues: true },
    transferTimesOptions: { allValues: true },
    permittedTimesOptions: { allValues: true },
    forbiddenTimesOptions: { noValues: true },
  }



  const handleSwitchChange = (idx: number) => {
    let idxs: number[] = [];
    if (idx == 2) {
      setSelectedIdxs([]);
    } else {
      setSelectedIdxs([...new Set([...selectedIdxs, idx])]);
      idxs = [...new Set([...selectedIdxs, idx])]
    }

    collections.updateCollection({
      ...collection,
      collectionPermissions: {
        ...collection.collectionPermissions,
        canUpdateCollectionApprovedTransfers: idxs.map((idx) => {
          if (idx === 1) {
            return {
              defaultValues: {
                fromMappingId: "AllWithoutMint",
                toMappingId: "AllWithMint",
                initiatedByMappingId: "AllWithMint",
                toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                fromMapping: getReservedAddressMapping("AllWithoutMint", "") as AddressMapping,
                initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],

                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
              combinations: [{
              }]
            }
          } else if (idx === 0) {
            return {
              defaultValues: {
                fromMappingId: "Mint",
                toMappingId: "AllWithMint",
                initiatedByMappingId: "AllWithMint",
                toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                fromMapping: getReservedAddressMapping("Mint", "") as AddressMapping,
                initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                badgeIds: lockedBadgeIds,
                ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],

                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
              combinations: [{
              }]
            }
          } else {
            return undefined
          }
        }).filter(x => x !== undefined) as any
      }
    });

    handleLocked(everythingLocked, collection.collectionPermissions.canUpdateCollectionApprovedTransfers);
  }

  const handleLocked = (locked: boolean, permissions: CollectionApprovedTransferPermissionWithDetails<bigint>[]) => {
    // const permissionDetails = getPermissionDetails(castBalancesActionPermissionToUniversalPermission(permissions), BalancesActionPermissionUsedFlags);
    const permissionDetails = getPermissionDetails(castCollectionApprovedTransferPermissionToUniversalPermission(permissions), ApprovedTransferPermissionUsedFlags);
    if (!permissionDetails.hasForbiddenTimes) {
      if (!locked) return [];
      else return [{
        defaultValues: {
          fromMappingId: "AllWithoutMint",
          toMappingId: "AllWithMint",
          initiatedByMappingId: "AllWithMint",
          toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
          fromMapping: getReservedAddressMapping("AllWithoutMint", "") as AddressMapping,
          initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
          approvalTrackerId: "All",
          challengeTrackerId: "All",
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],

          permittedTimes: [],
          forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        },
        combinations: [EverythingLockedCombination]
      }]
    }

    if (locked) {
      return permissions.map(x => ({
        ...x,
        combinations: [{}, EverythingLockedCombination],
      }))
    } else {
      return permissions.map(x => ({
        ...x,
        combinations: [{}]
      }))
    }
  }

  return {
    title: `Update transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from how badges are distributed, freezing addresses, revoking badges, etc.`,
    node:
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canUpdateCollectionApprovedTransfers"
        node={<>
          <br />
          <div className='primary-text flex-center'>
            <InfoCircleOutlined style={{ marginRight: 4 }} /> You can select multiple freeze options.
          </div>
          <br />

          <SwitchForm
            showCustomOption
            options={[
              {
                title: 'Freeze Distributions - Locked Badges',
                message: `For badges that you can not edit the supply of (${lockedBadgeIds.length == 0 ? 'None' : getBadgeIdsString(lockedBadgeIds)}), freeze the transferability from the Mint address (i.e. do not allow updates to the distribuion process for these badges). 
                ${unlockedBadgeIds.length == 0 ? '' : `The transferability from the Mint address for badges that you can edit the supply of (${getBadgeIdsString(unlockedBadgeIds)}) will remain updatable to enable you to distribute them in the future.`}`,
                isSelected: mintHasForbiddenTimes && !mintHasNeutralTimes && !mintHasPermittedTimes,
                disabled: lockedBadgeIds.length === 0,
              },
              {
                title: 'Freeze Non-Mint',
                message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
                isSelected: nonMintHasForbiddenTimes && !nonMintHasNeutralTimes && !nonMintHasPermittedTimes,
              },
              {
                title: 'Editable',
                message: `The manager will be able to edit the collection-level transferability for everything. This permission can be disabled in the future.`,
                isSelected: !permissionDetails.hasForbiddenTimes
              },
            ]}
            onSwitchChange={handleSwitchChange}

          />
          <Divider />
          {(permissionDetails.hasNeutralTimes || permissionDetails.hasPermittedTimes) && showAdvancedOptions && <>
            <Col md={24} xs={24} style={{ textAlign: 'center' }}>
              <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
                Permitted Options
              </Typography.Text>
            </Col>
            <div className="primary-text" style={{ textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} /> Anything forbidden will be permanently forbidden, but permitted values can be set to either be updatable (neutral) or permanently permitted.
            </div>
            <SwitchForm
              showCustomOption
              options={[
                {
                  title: 'Neutral',
                  message: `The permitted values will be set to permitted but can be updated by the manager. In the future, they can either be set to be permanently permitted or disabled (permanently forbidden).`,
                  isSelected: !everythingLocked,
                },
                {
                  title: 'Permanently Permitted',
                  message: `Moving forward, this permission will be frozen and not updatable. It will be locked to the selected value.`,
                  isSelected: everythingLocked,
                },
              ]}

              onSwitchChange={(idx) => {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateCollectionApprovedTransfers: handleLocked(idx === 1, collection.collectionPermissions.canUpdateCollectionApprovedTransfers)
                  }
                });
              }}
              helperMessage=""
            />
            <br />
            <br />
          </>}
        </>
        }
      />
    ,
    disabled: !!err,
  }
}