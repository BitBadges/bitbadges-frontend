import React, { useEffect, useState } from 'react';
import { MessageMsgRequestTransferManager, createTxMsgRequestTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Switch } from 'antd';


export function CreateTxMsgRequestTransferManagerModal({ collection, visible, setVisible, children, setBadgeCollection }
    : {
        collection: BitBadgeCollection,
        visible: boolean,
        setBadgeCollection: () => void,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [request, setRequest] = useState<boolean>(true);


    const txCosmosMsg: MessageMsgRequestTransferManager = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        addRequest: request,
    };

    //Reset states when modal is closed
    useEffect(() => {
        if (!visible) {
            setRequest(true);
        }
    }, [visible]);

    const items = [
        {
            title: 'Select',
            description: <>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Submit or Cancel Request
                    <div>
                        <b style={{ marginRight: 10 }}>{request ? 'Submit Request' : 'Remove Request'}</b>

                        <Switch defaultChecked onChange={() => setRequest(!request)} />
                    </div>
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
            onSuccessfulTx={() => { setBadgeCollection(); }}
            displayMsg={`You are ${request ? "requesting" : "cancelling your request"} to be the manager for collection ${collection.collectionId}`}
        >
            {children}
        </TxModal>
    );
}