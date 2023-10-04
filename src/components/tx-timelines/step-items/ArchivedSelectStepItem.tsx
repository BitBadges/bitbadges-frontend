import { getFullIsArchivedTimeline, validateIsArchivedUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function IsArchivedSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const canArchiveCollection = txTimelineContext.updateIsArchivedTimeline;
  const setCanArchiveCollection = txTimelineContext.setUpdateIsArchivedTimeline;

  if (!collection) return EmptyStepItem;
  const err = startingCollection ? validateIsArchivedUpdate(startingCollection.isArchivedTimeline, collection.isArchivedTimeline, startingCollection.collectionPermissions.canArchiveCollection) : undefined;

  return {
    title: 'Archived Status',
    description: <>{'Is this collection archived (read-only)?'}
    </>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        updateFlag={canArchiveCollection}
        setUpdateFlag={setCanArchiveCollection}
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
              <ErrDisplay err={err} />

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
                    isSelected: collection.isArchivedTimeline.length == 0 || collection.isArchivedTimeline.every(x => !x.isArchived),
                  },
                  {
                    title: 'Archived (Read-Only)',
                    message: 'Moving forward, this collection will be archived and read-only. All transactions will fail until the collection is unarchived.',
                    isSelected: collection.isArchivedTimeline.length > 0 && getFullIsArchivedTimeline(collection.isArchivedTimeline).every(x => x.isArchived),
                  },
                ]}
              />
            </div>
          </div >
        }
      />
  }
}