import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { Switch } from "antd";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { TimelineEditor } from "./ConfirmManagerStepItem";

const ArchivedSwitch = ({
  isArchived,
  setIsArchived,
}: {
  isArchived: boolean,
  setIsArchived: (isArchived: boolean) => void,
}) => {

  return <Switch
    checked={isArchived}
    onChange={(checked) => {
      setIsArchived(checked);
    }}
    checkedChildren="Archived"
    unCheckedChildren="Not Archived"
  />
}

export function IsArchivedSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canArchiveCollection = txTimelineContext.updateIsArchivedTimeline;
  const setCanArchiveCollection = txTimelineContext.setUpdateIsArchivedTimeline;

  const [err, setErr] = useState<Error | null>(null);
  const [currIsArchived, setCurrIsArchived] = useState(false);
  if (!collection) return EmptyStepItem;

  return {
    title: 'Archived Status',
    description: <>{'Is this collection archived (read-only)?'}</>,
    disabled: !!err,
    node: () => <UpdateSelectWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/manager"
        err={err}
        setErr={(err) => { setErr(err) }}
        updateFlag={canArchiveCollection}
        setUpdateFlag={setCanArchiveCollection}
        jsonPropertyPath="isArchivedTimeline"
        permissionName='canArchiveCollection'
        node={() => <div>
            <div className='primary-text'
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
                    isSelected: collection.isArchivedTimeline.length > 0 && !collection.isArchivedTimeline.every(x => !x.isArchived),
                    additionalNode: () => <TimelineEditor
                      emptyValue="Not Archived"
                      timeline={collection.isArchivedTimeline}
                      timelineName="Archived Status"
                      setTimeline={(timeline) => {
                        updateCollection({
                          collectionId: NEW_COLLECTION_ID,
                          isArchivedTimeline: timeline,
                        })
                      }}
                      displayNode={(timeline) => {
                        return <>{timeline.isArchived ? <>
                          Archived
                        </> : <>
                          Not Archived
                        </>}</>
                      }}
                      createNode={<div><br /><ArchivedSwitch isArchived={currIsArchived} setIsArchived={setCurrIsArchived} /></div>}
                      valueToAdd={{
                        isArchived: currIsArchived,
                        timelineTimes: [] //overwrite
                      }}
                    />
                  },
                ]}
              />
            </div>
          </div >
        }
      />
  }
}