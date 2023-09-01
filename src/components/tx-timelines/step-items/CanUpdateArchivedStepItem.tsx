import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanArchiveCollectionStepItem(

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
              message: `Moving forward, the manager will never be able to archive or unarchive the collection.`,
              isSelected: collection?.collectionPermissions.canArchiveCollection.length > 0
            },
            {
              title: 'Yes',
              message: `The manager will be able to archive or unarchive the collection, if desired.`,
              isSelected: collection?.collectionPermissions.canArchiveCollection.length === 0,
            }
          ]}
          onSwitchChange={(idx) => {

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canArchiveCollection: idx === 0 ? [{
                  defaultValues: {
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    permittedTimes: [],
                    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  },
                  combinations: [{
                    // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
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