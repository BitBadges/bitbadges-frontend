import { ReactNode } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { ApprovalsDisplay } from './ApprovalsTab';
import { InfoCircleOutlined } from '@ant-design/icons';

export function TransferabilityTab({ collectionId, badgeId, onlyShowFromMint, onlyShowNotFromMint, hideHelperMessage, setTab, onEdit, onDelete, addMoreNode, showDeletedGrayedOut }: {
  collectionId: bigint,
  badgeId?: bigint,
  onlyShowFromMint?: boolean,
  onlyShowNotFromMint?: boolean,
  hideHelperMessage?: boolean,
  setTab?: (tab: string) => void,
  onDelete?: (approvalId: string) => void,
  onEdit?: (approval: any) => void,
  addMoreNode?: ReactNode
  showDeletedGrayedOut?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

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
        setTab={setTab}
        onDelete={onDelete}
        onEdit={onEdit}
        addMoreNode={addMoreNode}
        title={addMoreNode ? onlyShowFromMint ? 'Transferability - Minting' : 'Transferability - Post-Minting' : ""}
        subtitle={addMoreNode ? onlyShowFromMint ? <><InfoCircleOutlined /> Set approvals for how badges are transferred out of the Mint address.</> : <><InfoCircleOutlined /> Post-minting, which transfer combinations for the collection should be allowed vs disallowed? </> : ""}
      />
    </>
  );
}

