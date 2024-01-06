import { MsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { UserOutgoingApprovalWithDetails } from 'bitbadgesjs-utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { EditableUserApprovalsTab } from '../collection-page/transferability/ApprovalsTab';
import { TxModal } from './TxModal';

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

  const items = [
    {
      title: 'Select',
      description: <div style={{ textAlign: 'center', }}>
        <EditableUserApprovalsTab
          collectionId={collectionId}
          userOutgoingApprovals={newOutgoingApprovals}
          setUserOutgoingApprovals={setNewOutgoingApprovals}
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

    return [
      {
        type: 'MsgUpdateUserApprovals',
        msg: txCosmosMsg,
        afterTx: async () => {
          await fetchCollections([collectionId], true);
          await fetchAccounts([chain.cosmosAddress], true);
        }
      }
    ]
  }, [chain.cosmosAddress, collectionId, newOutgoingApprovals]);

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