import React from 'react';
import { MessageMsgNewBadge, createTxMsgNewBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';

export function CreateTxMsgNewBadgeModal(
    { txCosmosMsg, visible, setVisible, children }
        :
        {
            txCosmosMsg: MessageMsgNewBadge,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
        }) {
    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Create Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgNewBadge}
            displayMsg={"You are creating badge: "}
        >
            {children}
        </TxModal>
    );
}
