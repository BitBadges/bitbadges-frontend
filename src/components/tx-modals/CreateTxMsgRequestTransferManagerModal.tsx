import { MessageMsgRequestTransferManager, createTxMsgRequestTransferManager } from 'bitbadgesjs-transactions';
import React from 'react';
import { BitBadgeCollection } from 'bitbadgesjs-utils';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxModal } from './TxModal';


export function CreateTxMsgRequestTransferManagerModal({ collection, visible, setVisible, children }
    : {
        collection: BitBadgeCollection,
        visible: boolean
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const collections = useCollectionsContext();

    const txCosmosMsg: MessageMsgRequestTransferManager = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        addRequest: collection.managerRequests.find((request) => request === chain.accountNumber) === undefined,
    };

    const items = [
        {
            title: 'Add / Remove Request',
            description: <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    <div>
                        <b style={{ marginRight: 10, fontSize: 20 }}> {collection.managerRequests.find((request) => request === chain.accountNumber) ? 'You have already requested to be the manager for this collection.' : 'You have not requested to be the manager for this collection yet.'}</b>
                    </div>
                    <div>
                        <p>{collection.managerRequests.find((request) => request === chain.accountNumber) ? `This transaction will cancel your request to become the manager of this collection (ID: ${collection.collectionId}).` : `This transaction will be a request to become the manager of this collection (ID: ${collection.collectionId}).`}</p>
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
            txName="Request Transfer Manager"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRequestTransferManager}
            onSuccessfulTx={async () => { await collections.refreshCollection(collection.collectionId); }}
            requireRegistration
        >
            {children}
        </TxModal>
    );
}