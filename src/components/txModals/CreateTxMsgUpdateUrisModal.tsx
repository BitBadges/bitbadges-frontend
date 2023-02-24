import { MessageMsgUpdateUris, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addToIpfs } from '../../bitbadges-api/api';
import { MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { useCollectionsContext } from '../../collections/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../mint/TxTimeline';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdateUrisModal({ visible, setVisible, children, collectionId }
    : {
        collectionId: number,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const chain = useChainContext();

    const [txState, setTxState] = useState<TxTimelineProps>();


    async function updateIPFSUris() {
        if (!txState) return;
        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (txState.addMethod == MetadataAddMethod.Manual) {
            let res = await addToIpfs(txState.collectionMetadata, txState.individualBadgeMetadata);
            txState.setNewCollectionMsg({
                ...txState.newCollectionMsg,
                collectionUri: 'ipfs://' + res.cid + '/collection',
                badgeUri: 'ipfs://' + res.cid + '/{id}',
            });
        }
    }

    const updateUrisMsg: MessageMsgUpdateUris = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        collectionUri: txState ? txState?.newCollectionMsg.collectionUri : '',
        badgeUri: txState ? txState?.newCollectionMsg.collectionUri : '',
    }

    const [disabled, setDisabled] = useState<boolean>(true);

    const msgSteps = [
        {
            title: 'Update Metadata',
            description: <TxTimeline txType='UpdateMetadata' collectionId={collectionId} onFinish={(txState: TxTimelineProps) => {
                setDisabled(false);
                setTxState(txState);
            }} />,
            disabled: disabled,
        }
    ];


    return (
        <TxModal
            beforeTx={async () => {
                await updateIPFSUris();
            }}
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Update Metadata"
            txCosmosMsg={updateUrisMsg}
            createTxFunction={createTxMsgUpdateUris}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(updateUrisMsg.collectionId);
                router.push(`/collections/${updateUrisMsg.collectionId}`)
            }}
        >
            {children}
        </TxModal >
    );
}