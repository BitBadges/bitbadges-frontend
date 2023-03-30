import { MessageMsgUpdateDisallowedTransfers, createTxMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { updateTransferMappingAccountNums } from '../../bitbadges-api/transferMappings';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateDisallowedTransfersModal({ visible, setVisible, children, collectionId }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
        collectionId: number,
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const chain = useChainContext();
    const accounts = useAccountsContext();

    const [txState, setTxState] = useState<TxTimelineProps>();
    const [disabled, setDisabled] = useState<boolean>(true);
    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);

    const updateDisallowedTransfersMsg: MessageMsgUpdateDisallowedTransfers = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        disallowedTransfers: txState ? txState.newCollectionMsg.disallowedTransfers : []
    };

    useEffect(() => {
        if (!txState) return;
        let newUnregisteredUsers: string[] = [];

        for (const transfer of txState.disallowedTransfersWithUnregisteredUsers) {
            for (const address of transfer.toUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }

            for (const address of transfer.fromUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }
        newUnregisteredUsers = [...new Set(newUnregisteredUsers)];
        setUnregisteredUsers(newUnregisteredUsers);
    }, [accounts, txState]);


    const onRegister = async () => {
        if (!txState) return;
        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true); //Upon update, this will trigger the useEffect() which updates unregisteredUsers to []


        const finalCollectionMsg = { ...txState.newCollectionMsg };


        for (const transferMapping of txState.disallowedTransfersWithUnregisteredUsers) {
            //Update the transferMappings with the updated account numbers for both the toUnregisteredUsers and fromUnregisteredUsers

            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.to = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeToUsers, transferMapping.to);
            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.from = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeFromUsers, transferMapping.from);
            }

            finalCollectionMsg.disallowedTransfers = txState.disallowedTransfersWithUnregisteredUsers.map((x) => {
                return {
                    to: x.to,
                    from: x.from
                }
            });
        }


        txState.setNewCollectionMsg(finalCollectionMsg);

        setVisible(true);
    }

    const msgSteps = [
        {
            title: 'Edit Transferability',
            description: <TxTimeline
                txType='UpdateDisallowed'
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
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Edit Transferability"
            txCosmosMsg={updateDisallowedTransfersMsg}
            createTxFunction={createTxMsgUpdateDisallowedTransfers}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collectionId);
                router.push(`/collections/${collectionId}`)
            }}
        >
            {children}
        </TxModal>
    );
}