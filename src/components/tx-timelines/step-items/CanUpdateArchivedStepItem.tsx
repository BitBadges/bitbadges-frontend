import { CollectionPermissions, TimedUpdatePermission } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { useState } from "react";

export function CanArchiveCollectionStepItem(
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
    title: 'Can archive / unarchive collection?',
    description: ``,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canArchiveCollection"
      existingCollectionId={existingCollectionId}
      node={
        <SwitchForm

          options={[
            {
              title: 'No',
              message: `Moving forward, the manager will never be able to archive or unarchive the collection. The current archived status will be permanently locked.`,
              isSelected: handledPermissions.canArchiveCollection.length > 0 && collection?.collectionPermissions.canArchiveCollection.length > 0
            },
            {
              title: 'Yes',
              message: `The manager will be able to archive or unarchive the collection, if desired.`,
              isSelected: handledPermissions.canArchiveCollection.length > 0 && collection?.collectionPermissions.canArchiveCollection.length === 0,
            }
          ]}
          onSwitchChange={(idx) => {
            setHandledPermissions({
              ...handledPermissions,
              canArchiveCollection: [{} as TimedUpdatePermission<bigint>]
            });

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canArchiveCollection: idx === 0 ? [{
                  defaultValues: {
                    timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                    permittedTimes: [],
                    forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                  },
                  combinations: [{
                    permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                  }]
                }] : []
              }
            });
          }}

        />
      }
    />
    ,
    disabled: handledPermissions.canArchiveCollection.length === 0 || !!err,

  }
}