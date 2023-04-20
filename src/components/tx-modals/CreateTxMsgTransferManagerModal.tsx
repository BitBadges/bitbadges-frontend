import { InfoCircleOutlined } from '@ant-design/icons';
import { MessageMsgTransferManager, createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import { BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from 'bitbadgesjs-utils';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferManagerModal({ collection, visible, setVisible, children }
    : {
        collection: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const collections = useCollectionsContext();
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
                <AddressSelect currUserInfo={currUserInfo} setCurrUserInfo={setCurrUserInfo} darkMode />
                <br />
                <InfoCircleOutlined /> The new manager must have already submitted a transfer manager request.
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
            onSuccessfulTx={async () => { await collections.refreshCollection(collection.collectionId); }}
            requireRegistration
        >
            {children}
        </TxModal>
    );
}
