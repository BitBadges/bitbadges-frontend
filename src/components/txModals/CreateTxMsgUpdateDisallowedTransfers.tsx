import { MessageMsgUpdateDisallowedTransfers, createTxMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import React from 'react';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateDisallowedTransfersModal({ visible, setVisible, children, txCosmosMsg }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        txCosmosMsg: MessageMsgUpdateDisallowedTransfers
    }) {

    return (
        <TxModal
            // msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Update Disallowed Transfers"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdateDisallowedTransfers}
            onSuccessfulTx={() => { //TODO: reroute to collection page
            }}
        >
            {children}
        </TxModal>
    );
}