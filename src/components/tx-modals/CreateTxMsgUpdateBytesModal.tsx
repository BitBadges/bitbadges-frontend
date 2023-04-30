import { Modal } from 'antd';
import { MessageMsgUpdateBytes, createTxMsgUpdateBytes } from 'bitbadgesjs-transactions';
import { getTransfersFromClaimItems } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { addBalancesToIpfs } from '../../bitbadges-api/api';
import { handleTransfers } from '../../bitbadges-api/transfers';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateBytesModal({ visible, setVisible, children, collectionId }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
        collectionId: number,
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const accounts = useAccountsContext();
    const chain = useChainContext();

    const [txState, setTxState] = useState<TxTimelineProps>();
    const [disabled, setDisabled] = useState<boolean>(true);
    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);

    useEffect(() => {
      if (!txState) return;
      let newUnregisteredUsers: string[] = [];
        for (const claimItem of txState?.claimItems) {
          console.log("TEsT", claimItem);
            for (const address of claimItem.addresses) {
                console.log(accounts.accounts[address].accountNumber);
              
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }
      newUnregisteredUsers = [...new Set(newUnregisteredUsers)];
      setUnregisteredUsers(newUnregisteredUsers);
    }, [accounts, txState]);


    const UpdateBytesMsg: MessageMsgUpdateBytes = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        newBytes: txState ? txState.newCollectionMsg.bytes: '',
    };

    async function updateIPFSUris() {
      if (!txState) return;

      let badgeMsg = txState.newCollectionMsg;
      let claimItems = txState.claimItems;

      if (badgeMsg.standard === 1) {
        const transfers = getTransfersFromClaimItems(claimItems, accounts.accounts);

        const balanceMap = await handleTransfers(["Mint"], transfers);

        let res = await addBalancesToIpfs(balanceMap);
        badgeMsg.bytes = 'ipfs://' + res.cid;
        badgeMsg.claims = [];
        badgeMsg.transfers = [];
      }

    return {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        newBytes: badgeMsg.bytes,
    } as MessageMsgUpdateBytes;
  }

  const onRegister = async () => {
      await accounts.fetchAccounts(unregisteredUsers, true); // This will update the useEffect() above and set unregisterUsers to []

      setVisible(true);
  }

    const msgSteps = [
        {
            title: 'Update Balances',
            description: <TxTimeline
                txType='UpdateBalances'
                collectionId={collectionId}
                onFinish={(txState: TxTimelineProps) => {
                    setDisabled(false);
                    setTxState(txState);
                }}
            />,
            disabled: disabled,
        }
    ];

    return (
        <TxModal
            beforeTx={async () => {
              const newMsg = await updateIPFSUris();
              return newMsg
            }}
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Update Balances"
            txCosmosMsg={UpdateBytesMsg}
            createTxFunction={createTxMsgUpdateBytes}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collectionId);
                router.push(`/collections/${collectionId}`)
                Modal.destroyAll()
            }}
            requireRegistration
        >
            {children}
        </TxModal>
    );
}