import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function StandardsSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateStandards = txTimelineContext.updateStandardsTimeline;
  const setCanUpdateStandards = txTimelineContext.setUpdateStandardsTimeline;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const options = [{
    title: "No Balances",
    message: "Balances are deemed unimportant and not displayed for this collection. This is useful for badges where only the metadata matters and recipients do not (e.g. attestations, predictions, etc.). If selected, you can just leave all balance related selections blank moving forward.",
    // additionalNode:
    //   <div className="secondary-text">
    //     {""}
    //   </div>,
    isSelected: collection.standardsTimeline.length ? collection.standardsTimeline[0].standards.includes("No Balances") : false,
  }];

  return {
    title: 'Standards',
    description: <>{'Select the standards for this collection. Standards let others know how to interpret this collection.'}</>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        err={err}
        setErr={(err) => { setErr(err) }}
        updateFlag={canUpdateStandards}
        setUpdateFlag={setCanUpdateStandards}
        jsonPropertyPath="standardsTimeline"
        permissionName='canUpdateStandards'
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
              <SwitchForm
                options={options}
                onSwitchChange={(idx) => {
                  const title = options[idx].title;

                  const inStandards = collection.standardsTimeline.length ? collection.standardsTimeline[0].standards.includes(title) : false;
                  const currStandards = collection.standardsTimeline.length ? collection.standardsTimeline[0].standards : [];
                  if (inStandards) {
                    //Remove it
                    const newStandards = currStandards.filter(x => x !== title);
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      standardsTimeline: [{
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        standards: newStandards,
                      }]
                    });
                  } else {
                    //Add it
                    const newStandards = [...currStandards, title];
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      standardsTimeline: [{
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        standards: newStandards,
                      }]
                    });
                  }
                }}
              />
            </div>
          </div >
        }
      />
  }
}