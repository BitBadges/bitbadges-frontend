import React, { useEffect, useState } from 'react';
import { BitBadgeCollection, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { MessageMsgTransferManager, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { AddressSelect } from '../address/AddressSelect';

export function CreateTxMsgTransferManagerModal({ collection, visible, setVisible, children }
    : {
        collection: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const [newManagerAccountNumber, setNewManagerAccountNumber] = useState<number>();

    const txCosmosMsg: MessageMsgTransferManager = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        address: newManagerAccountNumber ? newManagerAccountNumber : -1,
    };

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        if (!visible) {
            setNewManagerAccountNumber(undefined);
        }
    }, [visible]);

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setNewManagerAccountNumber(userInfo.accountNumber);
    }

    const items = [
        {
            title: 'Select Address',
            description: <>
                <AddressSelect onChange={handleChange} title={"New Manager"} />
                <br />
                *This will only go through if the address you select has submitted a request to become the manager of this collection.
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
        >
            {children}
        </TxModal>
    );
}
