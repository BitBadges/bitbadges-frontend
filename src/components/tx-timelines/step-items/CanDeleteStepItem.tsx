import { ActionPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { useState } from "react";

export function CanDeleteStepItem(

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
    title: 'Can Delete?',
    description: ``,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canDeleteCollection"
      existingCollectionId={existingCollectionId}
      node={

        <SwitchForm
          options={[
            {
              title: 'No',
              message: `Moving forward, the collection can never be deleted by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: handledPermissions.canDeleteCollection.length > 0 && collection.collectionPermissions.canDeleteCollection.length > 0
            },
            {
              title: 'Yes',
              message: `The collection can be deleted by the manager. This permission can be revoked at any time by the manager, if desired.`,
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
                    forbiddenTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                  }]
                }] : []
              }
            });
          }}

        />
      }
    />,
    disabled: handledPermissions.canDeleteCollection.length == 0 || !!err,
  }
}