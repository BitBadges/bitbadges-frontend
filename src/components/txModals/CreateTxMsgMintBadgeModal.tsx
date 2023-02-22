import React from 'react';
import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../collections/CollectionsContext';

export function CreateTxMsgMintBadgeModal(
    { txCosmosMsg, visible, setVisible, children, unregisteredUsers, onRegister }
        :
        {
            txCosmosMsg: MessageMsgMintBadge,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
            unregisteredUsers?: string[],
            onRegister?: () => Promise<void>
        }
) {
    const router = useRouter();
    const collections = useCollectionsContext();

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Mint Badges"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgMintBadge}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(txCosmosMsg.collectionId);
                router.push(`/collections/${txCosmosMsg.collectionId}`)
            }}
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
        >
            {children}
        </TxModal>
    );
}
