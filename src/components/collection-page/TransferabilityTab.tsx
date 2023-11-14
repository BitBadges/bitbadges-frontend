
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { EditableApprovalsDisplay } from './ApprovalsTab';

export function TransferabilityTab({ collectionId, badgeId, onlyShowFromMint, onlyShowNotFromMint, hideHelperMessage, showDeletedGrayedOut, editable }: {
  collectionId: bigint,
  badgeId?: bigint,
  onlyShowFromMint?: boolean,
  onlyShowNotFromMint?: boolean,
  hideHelperMessage?: boolean,
  editable?: boolean,
  showDeletedGrayedOut?: boolean
}) {

  const collection = useCollection(collectionId);

  const txTimelineContext = useTxTimelineContext();

  if (!collection) return <></>;

  return (
    <>
      <EditableApprovalsDisplay
        approvals={collection.collectionApprovals}
        collection={collection}
        badgeId={badgeId}
        filterFromMint={onlyShowNotFromMint}
        onlyShowFromMint={onlyShowFromMint}
        hideHelperMessage={hideHelperMessage}
        approvalLevel={"collection"}
        approverAddress=''
        editable={!!editable}
        mintingOnly={!!onlyShowFromMint}

        showDeletedGrayedOut={showDeletedGrayedOut}
        startingApprovals={txTimelineContext.startingCollection?.collectionApprovals ?? []}
        approvalPermissions={txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []}
        setApprovals={approvals => {
          updateCollection({
            collectionId: collectionId,
            collectionApprovals: approvals
          })
        }}
      />
    </>
  );
}

