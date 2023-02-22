import { MessageMsgUpdateUris, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import React from 'react';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../collections/CollectionsContext';


export function CreateTxMsgUpdateUrisModal({ visible, setVisible, children, txCosmosMsg }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        txCosmosMsg: MessageMsgUpdateUris
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();

    return (
        <TxModal
            // msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Update Metadata"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdateUris}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(txCosmosMsg.collectionId);
                router.push(`/collections/${txCosmosMsg.collectionId}`)
            }}
        >
            {children}
        </TxModal>
    );
}