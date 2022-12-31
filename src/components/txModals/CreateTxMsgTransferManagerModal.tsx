import React, { useState } from 'react';
import { BitBadgeCollection, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { MessageMsgTransferManager, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { AddressSelect } from '../address/AddressSelect';

export function CreateTxMsgTransferManagerModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const [newManagerAccountNumber, setNewManagerAccountNumber] = useState<number>();

    const txCosmosMsg: MessageMsgTransferManager = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        address: newManagerAccountNumber ? newManagerAccountNumber : -1,
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setNewManagerAccountNumber(userInfo.accountNumber);
    }

    const items = [
        {
            title: 'Select Address',
            description: <>
                <AddressSelect onChange={handleChange} title={"New Manager"} />
            </>,
            disabled: newManagerAccountNumber === undefined || newManagerAccountNumber === null || newManagerAccountNumber < 0
        }
    ]

    return (
        <TxModal
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Manager"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferManager}
        // displayMsg={"You are transfering the managerial privileges of this badge collection (ID: " + badge.id + ", Name: " + badge.collectionMetadata.name + ") to the address listed above."}
        >
            {children}
        </TxModal>
    );
}
