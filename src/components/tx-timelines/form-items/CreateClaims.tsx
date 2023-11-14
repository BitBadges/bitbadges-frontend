
import { DevMode } from '../../common/DevMode';

import { CollectionApprovalWithDetails } from 'bitbadgesjs-utils';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { ApprovalSelectWrapper } from '../../collection-page/ApprovalsTab';

export function CollectionApprovalSelect({ setVisible, nonMintApproval, defaultApproval,

}: {
  setVisible: (visible: boolean) => void, nonMintApproval?: boolean,
  defaultApproval?: CollectionApprovalWithDetails<bigint>,
}) {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const approvalsToAdd = collection?.collectionApprovals ?? [];
  const setApprovalsToAdd = (approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionApprovals: approvalsToAdd
    })
  }

  if (!collection) return <div></div>

  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <ApprovalSelectWrapper
        startingApprovals={txTimelineContext.startingCollection?.collectionApprovals ?? []}
        approvalPermissions={txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []}
        approvals={approvalsToAdd}
        approvalLevel='collection'
        setApprovals={setApprovalsToAdd}
        setVisible={setVisible}
        defaultApproval={defaultApproval}
        collection={collection}
        approverAddress=''
        mintingOnly={!nonMintApproval}
      />
    </div>
    <DevMode obj={approvalsToAdd} />
  </div >

}