import { validateCollectionApprovedTransfersUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";


export function JSONTransferabilitySelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovedTransfers = txTimelineContext.updateCollectionApprovedTransfers;
  const setUpdateCollectionApprovedTransfers = txTimelineContext.setUpdateCollectionApprovedTransfers;
  if (!collection) return EmptyStepItem;

  const err = startingCollection ? validateCollectionApprovedTransfersUpdate(startingCollection.collectionApprovedTransfers, collection.collectionApprovedTransfers, startingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers) : undefined;

  return {
    title: `Select Transferability`,
    // description: 
    description: <></>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovedTransfers}
      setUpdateFlag={setUpdateCollectionApprovedTransfers}
      jsonPropertyPath='collectionApprovedTransfers'
      permissionName='canUpdateCollectionApprovedTransfers'
      onlyShowJson={true}
      node={<></>}
    />,
    disabled: !!err,
  }
}