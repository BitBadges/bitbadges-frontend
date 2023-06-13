import { getNonTransferableTransferMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function TransferableSelectStepItem() {
  const [handledAllowedTransfers, setHandledAllowedTransfers] = useState(false);
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


  return {
    title: 'Transferable?',
    description: ``,
    disabled: !handledAllowedTransfers,
    node: <SwitchForm

      options={[
        {
          title: 'Non-Transferable',
          message: `Badge owners cannot transfer their badges to other addresses.`,
          isSelected: handledAllowedTransfers && collection && collection?.allowedTransfers.length > 0 ? true : false,
        },
        {
          title: 'Transferable',
          message: `Badge owners can transfer their badges to other addresses.`,
          isSelected: handledAllowedTransfers && collection && collection?.allowedTransfers.length == 0 ? true : false,
        },
      ]}
      onSwitchChange={(idx) => {
        if (!collection) return;

        const transferable = idx === 1;
        const nonTransferable = idx === 0;
        if (transferable) {
          collections.updateCollection({
            ...collection,
            allowedTransfers: getNonTransferableTransferMapping(),
          })
        } else if (nonTransferable) {
          collections.updateCollection({
            ...collection,
            allowedTransfers: [],
          })
        }
        setHandledAllowedTransfers(true);
      }}
    />,
  }
}