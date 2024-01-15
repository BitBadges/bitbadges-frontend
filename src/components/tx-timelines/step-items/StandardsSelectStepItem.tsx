import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { InfoCircleOutlined } from "@ant-design/icons";
import { Form, Input, Tag, Typography } from "antd";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { StandardsRow } from "../../badges/MetadataInfoDisplay";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const { Text } = Typography;

export function StandardsSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateStandards = txTimelineContext.updateStandardsTimeline;
  const setCanUpdateStandards = txTimelineContext.setUpdateStandardsTimeline;

  const [err, setErr] = useState<Error | null>(null);

  const [customStandards, setCustomStandards] = useState<string[]>([]);
  const [isCustomStandards, setIsCustomStandards] = useState<boolean>(false);

  if (!collection) return EmptyStepItem;

  const options = [
    {
      title: "None",
      message: <>Use the default standards for BitBadges collections. This is the default option and used in most cases.</>,
      isSelected: collection.standardsTimeline.length == 0,
    }, {

      title: "No User Ownership",
      message: <>Badges are not to be owned by anyone and user balances will not be displayed for this collection (e.g. attestation badges, prediction badges, etc.).
        Typically, this is not selected for most collections.
      </>,
      isSelected: collection.standardsTimeline.length ? collection.standardsTimeline[0].standards.includes("No User Ownership") : false,
    }, {
      title: "Custom",
      message: <>Select this if you want to add custom standards. All standards supported by this site are displayed in the other options, but
        custom standards can be added here for compatibility with other tools, sites, and frameworks.
      </>,
      isSelected: isCustomStandards,
      additionalNode: () => <Form colon={false} layout="vertical" style={{ textAlign: 'start' }}>
        <Form.Item
          label={
            <Text className="primary-text" strong>
              Custom Standards
            </Text>
          }
        >
          <div className="flex-between">
            <Input
              placeholder="Enter any custom standards here"
              value={customStandards}
              onChange={(e) => {
                if (!e.target.value) {
                  setCustomStandards([]);
                  return;
                }

                setCustomStandards(e.target.value.split(","))
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  standardsTimeline: [{
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    standards: [...collection.standardsTimeline[0].standards, ...e.target.value.split(",")],
                  }]
                });
              }}

              className="primary-text"
            />
          </div>
          <div style={{ fontSize: 12 }}>
            <Text className="secondary-text flex flex-wrap" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>
              *Separate with a comma (case sensitive).
            </Text>
            <div className="secondary-text flex flex-wrap" style={{ textAlign: 'start', alignItems: 'center', marginTop: 4 }}>
              {
                (customStandards).map((tag: any, idx: number) => {
                  if (!tag) return
                  return (
                    <Tag key={tag + idx} className="card-bg secondary-text" style={{ margin: 2 }}>
                      {tag}
                    </Tag>
                  )
                })
              }
            </div>
          </div>

        </Form.Item>
      </Form>
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
          <div className="secondary-text" style={{ textAlign: 'center', alignItems: 'center', marginTop: 4 }}>
            <InfoCircleOutlined /> You can select multiple options.
          </div>

          <SwitchForm

            options={options}
            onSwitchChange={(idx) => {
              if (idx == 0) {
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  standardsTimeline: []
                });
                setCustomStandards([]);
                setIsCustomStandards(false);
                return
              }
              if (idx == 2) {

                setIsCustomStandards(!isCustomStandards);
                return
              }
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