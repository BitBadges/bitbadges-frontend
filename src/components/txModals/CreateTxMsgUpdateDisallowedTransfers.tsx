import { MessageMsgUpdateDisallowedTransfers, createTxMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import React from 'react';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../collections/CollectionsContext';


export function CreateTxMsgUpdateDisallowedTransfersModal({ visible, setVisible, children, txCosmosMsg }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        txCosmosMsg: MessageMsgUpdateDisallowedTransfers
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();

    return (
        <TxModal
            // msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Update Disallowed Transfers"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdateDisallowedTransfers}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(txCosmosMsg.collectionId);
                router.push(`/collections/${txCosmosMsg.collectionId}`)
            }}
        >
            {children}
        </TxModal>
    );
}