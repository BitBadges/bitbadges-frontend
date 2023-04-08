import { message } from 'antd';
import { BitBadgeCollection } from 'bitbadges-sdk';
import { MessageMsgDeleteCollection, createTxMsgDeleteCollection } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React from 'react';
import { useChainContext } from '../../contexts/ChainContext';
import { TxModal } from './TxModal';


export function CreateTxMsgDeleteCollectionModal({ collection, visible, setVisible, children }
    : {
        collection: BitBadgeCollection,
        visible: boolean
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const router = useRouter();

    const txCosmosMsg: MessageMsgDeleteCollection = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
    };

    const items = [
        {
            title: 'Delete Confirmation',
            description: <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    <div>
                        <b style={{ marginRight: 10, fontSize: 20 }}>IMPORTANT: Once you delete this collection, it will be gone forever.</b>
                    </div>
                    <br />
                    <div>
                        <p>If you are sure you want to delete this collection, please continue.</p>
                    </div>
                    <br />
                </div>
            </>,
        }
    ]

    return (
        <TxModal
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Delete Collection"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgDeleteCollection}
            onSuccessfulTx={async () => {
                //Force refresh page
                message.success('Collection deleted successfully! Redirecting to home page...');
                router.push('/');
            }}
            requireRegistration
        >
            {children}
        </TxModal>
    );
}