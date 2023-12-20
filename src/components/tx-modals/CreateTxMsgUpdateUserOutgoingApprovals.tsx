import { MsgUpdateUserApprovals, createTxMsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { UserOutgoingApprovalWithDetails } from 'bitbadgesjs-utils';
import React, { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { UserApprovalsTab } from '../collection-page/ApprovalsTab';
import { TxModal } from './TxModal';
import { useCollection, fetchBalanceForUser, fetchCollections } from '../../bitbadges-api/contexts/collections/CollectionsContext';

export function CreateTxMsgUpdateUserOutgoingApprovalsModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);

  const [newOutgoingApprovals, setNewOutgoingApprovals] = useState<UserOutgoingApprovalWithDetails<bigint>[]>(collection?.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.outgoingApprovals ?? []);

  useEffect(() => {
    async function getApproveeBalance() {
      const balanceInfo = await fetchBalanceForUser(collectionId, chain.cosmosAddress);
      setNewOutgoingApprovals((balanceInfo?.outgoingApprovals ?? []));
    }
    getApproveeBalance();
  }, [chain.cosmosAddress, collectionId]);

  const txCosmosMsg: MsgUpdateUserApprovals<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    updateUserPermissions: false,
    userPermissions: {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    },
    updateIncomingApprovals: false,
    updateOutgoingApprovals: true,
    incomingApprovals: [],
    outgoingApprovals: newOutgoingApprovals.filter(x => x.approvalId !== 'default-incoming' && x.approvalId !== 'default-outgoing'),
    autoApproveSelfInitiatedIncomingTransfers: false,
    autoApproveSelfInitiatedOutgoingTransfers: false,
    updateAutoApproveSelfInitiatedIncomingTransfers: false,
    updateAutoApproveSelfInitiatedOutgoingTransfers: false,
  };

  const items = [
    {
      title: 'Select',
      description: <div style={{ textAlign: 'center', }}>
        <UserApprovalsTab
          collectionId={collectionId}
          isOutgoingApprovalEdit
          userOutgoingApprovals={newOutgoingApprovals}
          setUserOutgoingApprovals={setNewOutgoingApprovals}
        />
      </div>
    },
  ];

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Update Approvals"
      txType='MsgUpdateUserApprovals'
      txCosmosMsg={txCosmosMsg}
      style={{ minWidth: '95%' }}
      createTxFunction={createTxMsgUpdateUserApprovals}
      onSuccessfulTx={async () => {
        await fetchCollections([collectionId], true);
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}