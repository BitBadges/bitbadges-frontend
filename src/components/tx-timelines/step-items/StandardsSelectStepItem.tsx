import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { StandardsRow } from "../../badges/MetadataInfoDisplay";

export function StandardsSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateStandards = txTimelineContext.updateStandardsTimeline;
  const setCanUpdateStandards = txTimelineContext.setUpdateStandardsTimeline;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const options = [{
    title: "No User Ownership",
    message: <>Badges are not to be owned by anyone and user balances will not be displayed for this collection (e.g. attestation badges, prediction badges, etc.).
      Typically, this is not selected for most collections.
    </>,
    isSelected: collection.standardsTimeline.length ? collection.standardsTimeline[0].standards.includes("No User Ownership") : false,
  }];

  return {
    title: 'Standards',
    description: <>{'Standards let others know how to interpret this collection.'}</>,
    disabled: !!err,
    node: () => <UpdateSelectWrapper
      doNotUpdateNode={() => {
        return <StandardsRow collection={collection} />
      }}
      documentationLink={"https://docs.bitbadges.io/overview/how-it-works/standards"}
      err={err}
      setErr={(err) => { setErr(err) }}
      updateFlag={canUpdateStandards}
      setUpdateFlag={setCanUpdateStandards}
      jsonPropertyPath="standardsTimeline"
      permissionName='canUpdateStandards'
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

            options={options}
            onSwitchChange={() => {
              const title = "No User Ownership"

              const inStandards = collection.standardsTimeline.length ? collection.standardsTimeline[0].standards.includes(title) : false;
              const currStandards = collection.standardsTimeline.length ? collection.standardsTimeline[0].standards : [];
              if (inStandards) {
                //Remove it
                const newStandards = currStandards.filter(x => x !== title);


                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  standardsTimeline: newStandards.length == 0 ? [] : [{
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