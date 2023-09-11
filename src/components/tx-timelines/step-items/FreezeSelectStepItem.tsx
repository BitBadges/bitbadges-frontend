import { InfoCircleOutlined, InfoOutlined } from "@ant-design/icons";
import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping, invertUintRanges } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { AlwaysLockedPermission } from "./CanCreateMoreStepItem";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.
export function FreezeSelectStepItem(
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [selectedIdxs, setSelectedIdxs] = useState<number[]>([]);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const lockedBadgeIds = collection.collectionPermissions.canCreateMoreBadges.length > 0 ? collection.collectionPermissions.canCreateMoreBadges.map(x => x.defaultValues.badgeIds).flat() : [];
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  // If we never have a manager, this step will not be shown
  // const neverHasManager = collection.managerTimeline.length === 0 || collection.managerTimeline.every(timelineVal => !timelineVal.manager);

  return {
    title: `Edit Transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from how badges are distributed, freezing addresses, revoking badges, etc.`,
    node:
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canUpdateCollectionApprovedTransfers"
        existingCollectionId={existingCollectionId}
        node={<>
          <br />
          <div className='primary-text flex-center'>
            <InfoCircleOutlined style={{ marginRight: 4 }} /> You can select multiple freeze options.
          </div>
          <br />

          <SwitchForm
            options={[
              {
                title: 'Freeze Distributions - ONLY LOCKED BADGES',
                message: `For badges that you can not edit the supply of (${lockedBadgeIds.length == 0 ? 'None' : getBadgeIdsString(lockedBadgeIds)}), freeze the transferability from the Mint address (i.e. do not allow updates to the distribuion process for these badges). The transferability from the Mint address for badges that you can edit the supply of (${getBadgeIdsString(unlockedBadgeIds)}) will remain updatable to enable you to distribute them in the future.`,
                isSelected: collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length > 0
                  && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.some((transfer) => transfer.defaultValues.fromMappingId === "Mint"),
                disabled: lockedBadgeIds.length === 0,
              },
              {
                title: 'Freeze Non-Mint',
                message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
                isSelected: collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length > 0
                  && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.some((transfer) => transfer.defaultValues.fromMappingId !== "Mint"),
              },
              {
                title: 'Editable',
                message: `The manager will be able to edit the collection-level transferability for everything. This permission can be disabled in the future.`,
                isSelected: collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length === 0
              },
            ]}
            onSwitchChange={(idx) => {
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
            }
            }

          />
        </>
        }
      />
    ,
    disabled: !!err,
  }
}