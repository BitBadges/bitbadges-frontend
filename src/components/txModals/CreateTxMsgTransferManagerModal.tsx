import React, { useEffect, useState } from 'react';
import { BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { MessageMsgTransferManager, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { AddressSelect } from '../address/AddressSelect';

export function CreateTxMsgTransferManagerModal({ collection, visible, setVisible, children, refreshCollection }
    : {
        collection: BitBadgeCollection,
        refreshCollection: () => void
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        chain: SupportedChain.ETH,
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
    } as BitBadgesUserInfo);

    const txCosmosMsg: MessageMsgTransferManager = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        address: Number(currUserInfo.accountNumber),
    };

    const newManagerAccountNumber = txCosmosMsg.address;

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        if (!visible) {
            setCurrUserInfo({
                chain: SupportedChain.ETH,
                address: '',
                cosmosAddress: '',
                accountNumber: -1,
            } as BitBadgesUserInfo);
        }
    }, [visible]);

    const items = [
        {
            title: 'Select Address',
            description: <>
                <AddressSelect currUserInfo={currUserInfo} setCurrUserInfo={setCurrUserInfo} />
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
            onSuccessfulTx={() => { refreshCollection(); }}
        >
            {children}
        </TxModal>
    );
}
