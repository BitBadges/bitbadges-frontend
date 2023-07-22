import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { FOREVER_DATE } from "../../../utils/dates";

//TODO: Make this much more dynamic!
export function TransferableSelectStepItem() {
  const [handledAllowedTransfers, setHandledAllowedTransfers] = useState(false);
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection) return EmptyStepItem;

  return {
    title: 'Transferable?',
    description: ``,
    disabled: !handledAllowedTransfers,
    node: <SwitchForm
      options={[
        {
          title: 'Non-Transferable',
          message: `Once distributed from the Mint address, badge owners cannot transfer their badges to other addresses.`,
          isSelected: handledAllowedTransfers && collection && collection?.collectionApprovedTransfersTimeline.every(x => {
            return x.collectionApprovedTransfers.every(y => {
              return y.fromMappingId === "Mint"
            })
          })
        },
        {
          title: 'Transferable',
          message: `Once distributed from the Mint address, badge owners can transfer their badges to other addresses.`,
          isSelected: handledAllowedTransfers && collection && !collection?.collectionApprovedTransfersTimeline.every(x => {
            return x.collectionApprovedTransfers.every(y => {
              return y.fromMappingId === "Mint"
            })
          })
        },
      ]}
      onSwitchChange={(idx) => {
        if (!collection) return;

        const transferable = idx === 1;
        const nonTransferable = idx === 0;

        if (transferable) {
          collections.updateCollection({
            ...collection,
            collectionApprovedTransfersTimeline: collection.collectionApprovedTransfersTimeline.map(x => {
              return {
                ...x,
                collectionApprovedTransfers: [...x.collectionApprovedTransfers.filter(x => x.fromMappingId === "Mint"), {
                  toMappingId: "All",
                  fromMappingId: "All",
                  initiatedByMappingId: "All",
                  timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                  transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                  ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
                  badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                  allowedCombinations: [{
                    isAllowed: true,
                    badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                    ownedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                    fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                    initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                  }],
                  approvalDetails: [],
                }]
              }
            })
          })
        } else if (nonTransferable) {
          collections.updateCollection({
            ...collection,
            collectionApprovedTransfersTimeline: collection.collectionApprovedTransfersTimeline.map(x => {
              return {
                ...x,
                collectionApprovedTransfers: [...x.collectionApprovedTransfers.filter(x => x.fromMappingId === "Mint")]
              }
            })
          })
        }
        setHandledAllowedTransfers(true);
      }}
    />,
  }
}