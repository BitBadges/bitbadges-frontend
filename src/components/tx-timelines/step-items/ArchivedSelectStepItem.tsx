import { getFullIsArchivedTimeline } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

export function IsArchivedSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canArchiveCollection = txTimelineContext.updateIsArchivedTimeline;
  const setCanArchiveCollection = txTimelineContext.setUpdateIsArchivedTimeline;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  return {
    title: 'Archived Status',
    description: <>{'Is this collection archived (read-only)?'}</>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        err={err}
        setErr={(err) => { setErr(err) }}
        updateFlag={canArchiveCollection}
        setUpdateFlag={setCanArchiveCollection}
        jsonPropertyPath="isArchivedTimeline"
        permissionName='canArchiveCollection'
        node={

          <div>
            <div className='dark:text-white'
              style={{
                padding: '0',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >

              <SwitchForm
                // noSelectUntilClick
                showCustomOption
                onSwitchChange={(idx) => {
                  if (idx == 0) {
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      isArchivedTimeline: [],
                    })
                  } else {
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
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