import { CollectionApprovedTransferPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { FOREVER_DATE } from "../../../utils/dates";

//TODO: Add different presets. Can create more claims. Restrict by time, badge ID, etc.
export function FreezeSelectStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection) return EmptyStepItem;

  return {
    title: `Edit Transferability?`,
    description: ``, //You previously selected badges to be ${collection.allowedTransfers.length > 0 ? 'non-transferable' : 'transferable'} by default.
    node: <SwitchForm

      options={[
        {
          title: 'No',
          message: `The manager cannot edit the transferability. The transferability selected in the last step will be permanently frozen.`,
          isSelected: handledPermissions.canUpdateCollectionApprovedTransfers.length > 0 && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length > 0
        },
        {
          title: 'Yes',
          message: `The manager will be able to edit the transferability, unless the manager disables this permission in the future.`,
          isSelected: handledPermissions.canUpdateCollectionApprovedTransfers.length > 0 && collection.collectionPermissions.canUpdateCollectionApprovedTransfers.length === 0
        },
      ]}
      onSwitchChange={(idx) => {
        setHandledPermissions({
          ...handledPermissions,
          canUpdateCollectionApprovedTransfers: idx === 1 ? [{} as CollectionApprovedTransferPermission<bigint>] : []
        });

        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateCollectionApprovedTransfers: idx === 0 ? [{
              defaultValues: {
                fromMappingId: "All",
                toMappingId: "All",
                initiatedByMappingId: "All",
                timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                ownedTimes: [{ start: 1n, end: FOREVER_DATE }],

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
                ownedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
              }]
            }] : []
          }
        });
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
    />,
    disabled: handledPermissions.canUpdateCollectionApprovedTransfers.length == 0
  }
}