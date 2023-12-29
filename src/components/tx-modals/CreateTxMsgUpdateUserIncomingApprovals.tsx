import { MsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { UserIncomingApprovalWithDetails } from 'bitbadgesjs-utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { fetchBalanceForUser, fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { UserApprovalsTab } from '../collection-page/ApprovalsTab';
import { TxModal } from './TxModal';

export function CreateTxMsgUpdateUserIncomingApprovalsModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);

  const [newIncomingApprovals, setNewIncomingApprovals] = useState<UserIncomingApprovalWithDetails<bigint>[]>(collection?.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.incomingApprovals ?? []);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: approvee balance ');
    async function getApproveeBalance() {
      const balance = await fetchBalanceForUser(collectionId, chain.cosmosAddress);
      setNewIncomingApprovals((balance?.incomingApprovals ?? []));
    }
    getApproveeBalance();
  }, [chain.cosmosAddress, collectionId]);

  const items = [
    {
      title: 'Edit Approvals',
      description: <div className='flex-center flex-wrap' style={{ textAlign: 'center', }}>
        <UserApprovalsTab
          collectionId={collectionId}
          isIncomingApprovalEdit
          setUserIncomingApprovals={async (newApprovals) => {
            setNewIncomingApprovals(newApprovals);
          }}
          userIncomingApprovals={newIncomingApprovals}
        />
      </div>
    },
  ];

  const txsInfo = useMemo(() => {
  const txCosmosMsg: MsgUpdateUserApprovals<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    updateUserPermissions: false,
    userPermissions: {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: []
    },
    updateIncomingApprovals: true,
    updateOutgoingApprovals: false,
    incomingApprovals: newIncomingApprovals.filter(x => x.approvalId !== 'default-incoming' && x.approvalId !== 'default-outgoing'),
    outgoingApprovals: [],
    updateAutoApproveSelfInitiatedIncomingTransfers: false,
    updateAutoApproveSelfInitiatedOutgoingTransfers: false,
    autoApproveSelfInitiatedIncomingTransfers: false,
    autoApproveSelfInitiatedOutgoingTransfers: false,
  };

  return [
    {
      type: 'MsgUpdateUserApprovals',
      msg: txCosmosMsg,
      afterTx: async () => {
        await fetchCollections([collectionId], true);
      }
    }
  ]
}, [chain.cosmosAddress, collectionId, newIncomingApprovals]);

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Update Approvals"
      requireRegistration
      style={{ minWidth: '95%' }}
    >
      {children}
    </TxModal>

  );
}