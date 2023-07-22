import { ActionPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanDeleteStepItem(

  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection) return EmptyStepItem;

  return {
    title: 'Can Delete?',
    description: ``,
    node: <SwitchForm
      options={[
        {
          title: 'No',
          message: `These badge(s) will always exist and can never be deleted.`,
          isSelected: handledPermissions.canDeleteCollection.length > 0 && collection.collectionPermissions.canDeleteCollection.length > 0
        },
        {
          title: 'Yes',
          message: `These badge(s) can be deleted by the manager.`,
          isSelected: handledPermissions.canDeleteCollection.length > 0 && collection.collectionPermissions.canDeleteCollection.length === 0,
        },
      ]}
      onSwitchChange={(idx) => {
        setHandledPermissions({
          ...handledPermissions,
          canDeleteCollection: [{} as ActionPermission<bigint>]
        });

        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canDeleteCollection: idx === 0 ? [{
              defaultValues: {
                permittedTimes: [],
                forbiddenTimes: [],
              },
              combinations: [{
                permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
              }]
            }] : []
          }
        });
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: handledPermissions.canDeleteCollection.length == 0,
  }
}