import { Divider } from "antd";
import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, validateIsArchivedUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { MSG_PREVIEW_ID, EmptyStepItem } from "../../../bitbadges-api/contexts/TxTimelineContext";

export function IsArchivedSelectStepItem(
  canArchiveCollection: boolean,
  setCanArchiveCollection: (canArchiveCollection: boolean) => void,
  existingCollectionId?: bigint
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem;
  const err = existingCollection ? validateIsArchivedUpdate(existingCollection.isArchivedTimeline, collection.isArchivedTimeline, existingCollection.collectionPermissions.canArchiveCollection) : undefined;

  return {
    title: 'Archived Status',
    description: <>{'Is this collection archived (read-only)?'}
    </>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        updateFlag={canArchiveCollection}
        setUpdateFlag={setCanArchiveCollection}
        existingCollectionId={existingCollectionId}
        jsonPropertyPath="isArchivedTimeline"
        permissionName='canArchiveCollection'
        node={

          <div>
            <div className='primary-text'
              style={{
                padding: '0',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {err &&
                <div style={{ color: 'red', textAlign: 'center' }}>
                  <b>Error: </b>You are attempting to update a previously frozen value.
                  <Divider />
                </div>}

              <SwitchForm
                // noSelectUntilClick
                showCustomOption
                onSwitchChange={(idx) => {
                  if (idx == 0) {
                    collections.updateCollection({
                      ...collection,
                      isArchivedTimeline: [],
                    })
                  } else {
                    collections.updateCollection({
                      ...collection,
                      isArchivedTimeline: [{
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        isArchived: true,
                      }],
                    })
                  }
                }}
                options={[
                  {
                    title: 'Not Archived',
                    message: 'All transactions will succeed. The collection will not be archived.',
                    isSelected: collection.isArchivedTimeline.length == 0,
                  },
                  {
                    title: 'Archived (Read-Only)',
                    message: 'Moving forward, this collection will be archived and read-only. All transactions will fail until the collection is unarchived.',
                    isSelected: collection.isArchivedTimeline.length > 0,
                  },
                ]}
              />
            </div>
          </div >
        }
      />
  }
}