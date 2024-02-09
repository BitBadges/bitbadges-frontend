import { MsgUpdateUserApprovals } from 'bitbadgesjs-sdk';
import { UserIncomingApprovalWithDetails } from 'bitbadgesjs-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { EditableUserApprovalsTab } from '../collection-page/transferability/ApprovalsTab';
import { UpdateSelectWrapper } from '../tx-timelines/form-items/UpdateSelectWrapper';
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
      description: <UpdateSelectWrapper
        documentationLink={"https://docs.bitbadges.io/overview/how-it-works/transferability"}
        err={null}
        setErr={() => { }}
        updateFlag={true}
        setUpdateFlag={() => { }}
        jsonPropertyPath='defaultUserIncomingApprovals'
        customRevertFunction={() => {
          setNewIncomingApprovals(collection?.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.incomingApprovals ?? []);
        }}
        advancedNode={() => <>
          <div className='flex-center flex-wrap' style={{ textAlign: 'center', }}>
            <EditableUserApprovalsTab
              collectionId={collectionId}
              advancedMode
              setUserIncomingApprovals={async (newApprovals) => {
                setNewIncomingApprovals(newApprovals);
              }}
              userIncomingApprovals={newIncomingApprovals}
            />
          </div>
        </>}
        node={() => <>
          <div className='flex-center flex-wrap' style={{ textAlign: 'center', }}>
            <EditableUserApprovalsTab
              collectionId={collectionId}
              setUserIncomingApprovals={async (newApprovals) => {
                setNewIncomingApprovals(newApprovals);
              }}
              userIncomingApprovals={newIncomingApprovals}
            />
          </div>
        </>}
      />
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
      incomingApprovals: newIncomingApprovals.filter(x => x.approvalId !== 'self-initiated-incoming' && x.approvalId !== 'self-initiated-outgoing'),
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
          await fetchAccounts([chain.cosmosAddress], true);
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
      style={{ minWidth: '95%' }}
    >
      {children}
    </TxModal>

  );
}