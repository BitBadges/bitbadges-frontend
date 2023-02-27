import { MessageMsgNewCollection, createTxMsgNewCollection } from 'bitbadgesjs-transactions';
import React from 'react';
import { TxModal } from './TxModal';

export function CreateTxMsgNewCollectionModal(
    { txCosmosMsg, visible, setVisible, children, unregisteredUsers, onRegister }
        :
        {
            txCosmosMsg: MessageMsgNewCollection,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
            unregisteredUsers?: string[],
            onRegister?: () => Promise<void>
        }) {
    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Create Collection"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgNewCollection}
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
            onSuccessfulTx={async () => {
                //navigating to the new collection page is handled in TxModal
            }}
        >
            {children}
        </TxModal>
    );
}
