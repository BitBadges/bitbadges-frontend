import { AddressMapping, CollectionApprovedTransferPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { FOREVER_DATE } from "../../../utils/dates";
import { getReservedAddressMapping } from "bitbadgesjs-utils";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { useState } from "react";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.
export function FreezeSelectStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  return {
    title: `Edit Transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from new claims, freezing addresses, revoking badges, etc.`,
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
                message: `The manager cannot edit the collection-level transferability. The transferability selected in the previous steps will be permanently frozen.`,
                isSelected: handledPermissions.canUpdateCollectionApprovedTransfers.length > 0 && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length > 0
              },
              {
                title: 'Yes',
                message: `The manager will be able to edit the collection-level transferability. This permission can be disabled in the future.`,
                isSelected: handledPermissions.canUpdateCollectionApprovedTransfers.length > 0 && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length === 0
              },
            ]}
            onSwitchChange={(idx) => {
              setHandledPermissions({
                ...handledPermissions,
                canUpdateCollectionApprovedTransfers: [{} as CollectionApprovedTransferPermission<bigint>]
              });

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
                      timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                      transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                      badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                      ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],

                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                    },
                    combinations: [{
                      initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
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
                      timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                      transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                      badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                      ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],

                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                    },
                    combinations: [{
                      initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    }]
                  }] : []
                }
              });
            }}

          />
        }
      />
    ,
    disabled: handledPermissions.canUpdateCollectionApprovedTransfers.length == 0 || !!err,
  }
}