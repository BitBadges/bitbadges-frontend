import React, { useEffect, useState } from 'react';
import { MessageMsgFreezeAddress, MessageMsgRequestTransferManager, MessageMsgRevokeBadge, createTxMsgFreezeAddress, createTxMsgRequestTransferManager, createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber, Switch } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


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

    return (
        <TxModal
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Request Transfer Manager"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRequestTransferManager}
            displayMsg={`You are ${request ? "requesting" : "cancelling any request"} to be the manager for badge ${badge.id}`}
        >
            Request or Cancel
            <Switch defaultChecked onChange={() => setRequest(!request)} />
            {children}
        </TxModal>
    );
}