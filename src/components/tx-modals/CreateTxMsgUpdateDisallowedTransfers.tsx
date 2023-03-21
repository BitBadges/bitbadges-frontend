import { MessageMsgUpdateDisallowedTransfers, createTxMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import React, { useState } from 'react';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';


export function CreateTxMsgUpdateDisallowedTransfersModal({ visible, setVisible, children, collectionId }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
        collectionId: number,
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const chain = useChainContext();

    const [txState, setTxState] = useState<TxTimelineProps>();
    const [disabled, setDisabled] = useState<boolean>(true);

    const updateDisallowedTransfersMsg: MessageMsgUpdateDisallowedTransfers = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        disallowedTransfers: txState ? txState.newCollectionMsg.disallowedTransfers : []
    }

    const msgSteps = [
        {
            title: 'Edit Transferability',
            description: <TxTimeline txType='UpdateDisallowed' collectionId={collectionId} onFinish={(txState: TxTimelineProps) => {
                setDisabled(false);
                setTxState(txState);
            }} />,
            disabled: disabled,
        }
    ];

    return (
        <TxModal
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Edit Transferability"
            txCosmosMsg={updateDisallowedTransfersMsg}
            createTxFunction={createTxMsgUpdateDisallowedTransfers}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collectionId);
                router.push(`/collections/${collectionId}`)
            }}
        >
            {children}
        </TxModal>
    );
}