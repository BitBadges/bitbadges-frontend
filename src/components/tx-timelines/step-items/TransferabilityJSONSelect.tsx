import { validateCollectionApprovedTransfersUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";


export function JSONTransferabilitySelectStepItem(
  updateCollectionApprovedTransfers: boolean,
  setUpdateCollectionApprovedTransfers: (val: boolean) => void,

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem;

  const err = existingCollection ? validateCollectionApprovedTransfersUpdate(existingCollection.collectionApprovedTransfersTimeline, collection.collectionApprovedTransfersTimeline, existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers) : undefined;

  return {
    title: `Select Transferability`,
    // description: 
    description: <></>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovedTransfers}
      setUpdateFlag={setUpdateCollectionApprovedTransfers}
      existingCollectionId={existingCollectionId}
      jsonPropertyPath='collectionApprovedTransfersTimeline'
      permissionName='canUpdateCollectionApprovedTransfers'
      onlyShowJson={true}
      node={<p className="primary-text" style={{ textAlign: 'center' }}>
        fsdlka
      </p>}
    />,
    disabled: !!err,
  }
}