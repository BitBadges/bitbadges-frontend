import React, { useState } from 'react';
import { MessageMsgRequestTransferManager, createTxMsgRequestTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Switch } from 'antd';


export function CreateTxMsgRequestTransferManagerModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [request, setRequest] = useState<boolean>(true);


    const txCosmosMsg: MessageMsgRequestTransferManager = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        add: request,
    };

    const items = [
        {
            title: 'Select',
            description: <>
                Request or Cancel
                <Switch defaultChecked onChange={() => setRequest(!request)} />
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
            displayMsg={`You are ${request ? "requesting" : "cancelling your request"} to be the manager for badge ${badge.id}`}
        >
            {children}
        </TxModal>
    );
}