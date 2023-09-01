import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.
export function FreezeSelectStepItem(

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

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
        node={
          <SwitchForm

            options={[
              {
                title: 'No',
                message: `The manager cannot edit the collection-level transferability. What was selected in the previous steps will be permanently frozen. If you select this option, make sure all badges can be minted and distributed as intended with the current settings because they cannot be edited.`,
                isSelected: collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length > 0
              },
              {
                title: 'Yes',
                message: `The manager will be able to edit the collection-level transferability. This permission can be disabled in the future.`,
                isSelected: collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length === 0
              },
            ]}
            onSwitchChange={(idx) => {

              collections.updateCollection({
                ...collection,
                collectionPermissions: {
                  ...collection.collectionPermissions,
                  canUpdateCollectionApprovedTransfers: idx === 0 ? [{
                    defaultValues: {
                      fromMappingId: "AllWithMint",
                      toMappingId: "AllWithMint",
                      initiatedByMappingId: "AllWithMint",
                      toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                      fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                      initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],

                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    },
                    combinations: [{
                      // initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      // ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    }]
                  },
                  {
                    defaultValues: {
                      fromMappingId: "Mint",
                      toMappingId: "Mint",
                      initiatedByMappingId: "Mint",
                      toMapping: getReservedAddressMapping("Mint", "") as AddressMapping,
                      fromMapping: getReservedAddressMapping("Mint", "") as AddressMapping,
                      initiatedByMapping: getReservedAddressMapping("Mint", "") as AddressMapping,
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],

                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    },
                    combinations: [{
                      // initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      // ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    }]
                  }] : []
                }
              });
            }}

          />
        }
      />
    ,
    disabled: !!err,
  }
}