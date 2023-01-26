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

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Create Collection"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgNewCollection}
        >
            {children}
        </TxModal>
    );
}
