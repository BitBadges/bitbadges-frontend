import React, { useEffect, useState } from 'react';
import { Typography, Input, Select, Form } from 'antd';
import { BitBadgeCollection, SupportedChain } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain_handlers_frontend/ChainContext';
import { createTxMsgTransferManager } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { ethToCosmos, } from 'bitbadgesjs-address-converter';
import { AddressSelect } from '../AddressSelect';

export function CreateTxMsgTransferManagerModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {

    const [accountNumber, setAccountNumber] = useState<number>();
    const chain = useChainContext();

    const txCosmosMsg = {
        creator: ethToCosmos(chain.address),
        badgeId: badge.id,
        address: accountNumber ? accountNumber : -1,
    };

    const handleChange = (cosmosAddress: string, accountNumber: number) => {
        setAccountNumber(accountNumber);
    }

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Manager"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferManager}
            displayMsg={"You are transfering the managerial privileges of this badge collection (ID: " + badge.id + ", Name: " + badge.metadata.name + ")."}
            disabled={accountNumber === undefined || accountNumber === null || accountNumber < 0}
            destroyOnClose={true}
        >
            <b>Select New Manager</b>
            <AddressSelect onChange={handleChange} />
            <hr />
            <Typography.Text strong>
                *Warning: This action is permanent. Once you transfer managerial privileges to this new address, you will lose all privileges on this current address.
            </Typography.Text>
            {children}
        </TxModal>
    );
}
