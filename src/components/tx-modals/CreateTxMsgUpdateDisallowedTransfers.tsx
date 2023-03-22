import { MessageMsgUpdateDisallowedTransfers, createTxMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { IdRange } from '../../bitbadges-api/types';
import { InsertRangeToIdRanges, RemoveIdsFromIdRange } from '../../bitbadges-api/idRanges';


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

    const [updateDisallowedTransfersMsg, setUpdateDisallowedTransfersMsg] = useState<MessageMsgUpdateDisallowedTransfers>({
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        disallowedTransfers: txState ? txState.newCollectionMsg.disallowedTransfers : []
    });

    useEffect(() => {
        setUpdateDisallowedTransfersMsg({
            creator: chain.cosmosAddress,
            collectionId: collectionId,
            disallowedTransfers: txState ? txState.newCollectionMsg.disallowedTransfers : []
        });
    }, [txState, chain, collectionId]);




    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);



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



    function updateUnregisteredUsers() {
        if (!txState) return;
        //Get new account numbers for unregistered users
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
        setUnregisteredUsers(newUnregisteredUsers);
        console.log("UNREGISTED", newUnregisteredUsers);
    }



    const onRegister = async () => {
        if (!txState) return;
        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true);
        console.log("FETCHED ACCTS", fetchedAccounts);

        updateUnregisteredUsers();

        const finalCollectionMsg = { ...txState.newCollectionMsg };

        for (const transferMapping of txState.disallowedTransfersWithUnregisteredUsers) {
            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeToUsers) {
                    for (const idRange of transferMapping.to.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.to.accountNums = newAccountNums;
                } else {
                    if (transferMapping.to.accountNums.length == 0) {
                        transferMapping.to.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                    } else {
                        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                        transferMapping.to.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.to.accountNums);
                    }
                }
            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeFromUsers) {
                    for (const idRange of transferMapping.from.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.from.accountNums = newAccountNums;
                } else {
                    if (transferMapping.from.accountNums.length == 0) {
                        transferMapping.from.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                    } else {
                        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                        transferMapping.from.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.from.accountNums);
                    }
                }
            }

            finalCollectionMsg.disallowedTransfers = txState.disallowedTransfersWithUnregisteredUsers.map((x) => {
                return {
                    to: x.to,
                    from: x.from
                }
            });
        }

        console.log("finalCollectionMsg", finalCollectionMsg);
        txState.setNewCollectionMsg(finalCollectionMsg);

        setVisible(true);

        setUpdateDisallowedTransfersMsg({
            creator: chain.cosmosAddress,
            collectionId: collectionId,
            disallowedTransfers: finalCollectionMsg.disallowedTransfers,
        });

        return finalCollectionMsg;
    }

    const msgSteps = [
        {
            title: 'Edit Transferability',
            description: <TxTimeline txType='UpdateDisallowed' collectionId={collectionId} onFinish={(txState: TxTimelineProps) => {
                setDisabled(false);
                setTxState(txState);
            }} />,
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