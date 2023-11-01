import { ReactNode } from 'react';

import { ApprovalsDisplay } from './ApprovalsTab';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';

export function TransferabilityTab({ collectionId, badgeId, onlyShowFromMint, onlyShowNotFromMint, hideHelperMessage, editable, onDelete, addMoreNode, showDeletedGrayedOut }: {
  collectionId: bigint,
  badgeId?: bigint,
  onlyShowFromMint?: boolean,
  onlyShowNotFromMint?: boolean,
  hideHelperMessage?: boolean,
  onDelete?: (approvalId: string) => void,
  editable?: boolean,
  addMoreNode?: ReactNode
  showDeletedGrayedOut?: boolean
}) {

  const collection = useCollection(collectionId);

  const txTimelineContext = useTxTimelineContext();

  if (!collection) return <></>;

  return (
    <>
      <ApprovalsDisplay
        approvals={collection.collectionApprovals}
        collection={collection}
        badgeId={badgeId}
        filterFromMint={onlyShowNotFromMint}
        onlyShowFromMint={onlyShowFromMint}
        hideHelperMessage={hideHelperMessage}
        approvalLevel={"collection"}
        approverAddress=''

        showDeletedGrayedOut={showDeletedGrayedOut}
        onDelete={onDelete}
        editable={editable}
        startingApprovals={addMoreNode ? txTimelineContext.startingCollection?.collectionApprovals : undefined}
        addMoreNode={addMoreNode}
        title={addMoreNode ? onlyShowFromMint ? 'Transferability - Minting' : 'Transferability - Post-Minting' : ""}

        subtitle={addMoreNode ? onlyShowFromMint ? <><InfoCircleOutlined /> Set approvals for how badges are transferred out of the Mint address.</> : <><InfoCircleOutlined /> Post-minting, which transfer combinations for the collection should be allowed vs disallowed? </> : ""}
      />
    </>
  );
}

