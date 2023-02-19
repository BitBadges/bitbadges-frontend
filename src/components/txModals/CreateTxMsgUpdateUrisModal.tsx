import { MessageMsgUpdateUris, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import React from 'react';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateUrisModal({ visible, setVisible, children, txCosmosMsg }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        txCosmosMsg: MessageMsgUpdateUris
    }) {

    return (
        <TxModal
            // msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Update Metadata"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdateUris}
            onSuccessfulTx={() => { //TODO: reroute to collection page
            }}
        >
            {children}
        </TxModal>
    );
}