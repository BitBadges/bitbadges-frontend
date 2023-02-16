import React from 'react';
import { MessageMsgNewCollection, createTxMsgNewCollection } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';

export function CreateTxMsgNewCollectionModal(
    { txCosmosMsg, visible, setVisible, children }
        :
        {
            txCosmosMsg: MessageMsgNewCollection,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
        }) {

    //TODO: Handle unregisted users
    // const unregisteredUsers = txCosmosMsg.transfers.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    // const onRegister = async () => {
    //     let allRegisteredUsers = toAddresses.filter((user) => user.accountNumber !== -1);
    //     let newUsersToRegister = toAddresses.filter((user) => user.accountNumber === -1);
    //     for (const user of newUsersToRegister) {
    //         const newAccountNumber = await getAccountInformation(user.cosmosAddress).then((accountInfo) => {
    //             return accountInfo.account_number;
    //         });
    //         allRegisteredUsers.push({ ...user, accountNumber: newAccountNumber });
    //     }

    //     setToAddresses(allRegisteredUsers);
    // }

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Create Collection"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgNewCollection}
            onSuccessfulTx={() => { //TODO: navigate to page
            }}
        >
            {children}
        </TxModal>
    );
}
