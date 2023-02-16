import React from 'react';
import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';

export function CreateTxMsgMintBadgeModal(
    { txCosmosMsg, visible, setVisible, children }
        :
        {
            txCosmosMsg: MessageMsgMintBadge,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
        }
) {

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Mint Badges"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgMintBadge}
            onSuccessfulTx={() => { //TODO: navigate to page
            }}
        >
            {children}
        </TxModal>
    );
}
