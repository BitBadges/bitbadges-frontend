import { MsgUpdateUserApprovedTransfers, createTxMsgUpdateUserApprovedTransfers } from 'bitbadgesjs-proto';
import { UserApprovedIncomingTransferWithDetails } from 'bitbadgesjs-utils';
import React, { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { UserApprovalsTab } from '../collection-page/ApprovalsTab';
import { TxModal } from './TxModal';

export function CreateTxMsgUpdateUserApprovedIncomingTransfersModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();

  const [newApprovedIncomingTransfers, setNewApprovedIncomingTransfers] = useState<UserApprovedIncomingTransferWithDetails<bigint>[]>(collections.collections[`${collectionId}`]?.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.approvedIncomingTransfers ?? []);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: approvee balance ');
    async function getApproveeBalance() {
      await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress);
    }
    getApproveeBalance();
  }, []);


  const txCosmosMsg: MsgUpdateUserApprovedTransfers<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    updateUserPermissions: false,
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    },
    updateApprovedIncomingTransfers: true,
    updateApprovedOutgoingTransfers: false,
    approvedIncomingTransfers: newApprovedIncomingTransfers,
    approvedOutgoingTransfers: [],
  };

  const items = [
    {
      title: 'Edit Approvals',
      description: <div className='flex-center flex-wrap' style={{ textAlign: 'center', }}>
        <UserApprovalsTab
          collectionId={collectionId}
          isIncomingApprovalEdit
          setUserApprovedIncomingTransfers={async (newApprovals) => {
            setNewApprovedIncomingTransfers(newApprovals);
          }}
          userApprovedIncomingTransfers={newApprovedIncomingTransfers}
        />
        <br />
      </div>
    },
  ];

  console.log(txCosmosMsg);

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Update Approvals"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgUpdateUserApprovedTransfers}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
      }}
      requireRegistration
      style={{ minWidth: '95%' }}
    >
      {children}
    </TxModal>
  );
}