import { MessageMsgUpdateUris, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addToIpfs } from '../../bitbadges-api/api';
import { MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxModal } from './TxModal';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';


export function CreateTxMsgUpdateUrisModal({ visible, setVisible, children, collectionId
}: {
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
            const keys = Object.keys(txState.individualBadgeMetadata);
            const values = Object.values(txState.individualBadgeMetadata);
            let badgeUris = [];
            for (let i = 0; i < keys.length; i++) {
                badgeUris.push({
                    uri: 'ipfs://' + res.cid + '/batch/' + keys[i],
                    badgeIds: values[i].badgeIds
                });
            }

            setTxState({
                ...txState,
                newCollectionMsg: {
                    ...txState.newCollectionMsg,
                    collectionUri: 'ipfs://' + res.cid + '/collection',
                    badgeUris
                }
            });
            return {
                creator: chain.cosmosAddress,
                collectionId: collectionId,
                collectionUri: 'ipfs://' + res.cid + '/collection',
                badgeUris: badgeUris
            }
        }
    }

    const updateUrisMsg: MessageMsgUpdateUris = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        collectionUri: txState ? txState?.newCollectionMsg.collectionUri : '',
        badgeUris: txState ? txState?.newCollectionMsg.badgeUris : [],
    }

    const [disabled, setDisabled] = useState<boolean>(true);

    const msgSteps = [
        {
            title: 'Update Metadata',
            description: <TxTimeline txType='UpdateMetadata'
                collectionId={collectionId}
                onFinish={(txState: TxTimelineProps) => {
                    setDisabled(false);
                    setTxState(txState);
                }}
            />,
            disabled: disabled,
        }
    ];


    return (
        <TxModal
            beforeTx={async () => {
                const newMsg = await updateIPFSUris();
                return newMsg;
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