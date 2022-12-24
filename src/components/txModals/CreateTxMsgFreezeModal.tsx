import React, { useEffect, useState } from 'react';
import { MessageMsgFreezeAddress, MessageMsgRevokeBadge, createTxMsgFreezeAddress, createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


export function CreateTxMsgFreezeModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currAddress, setCurrAddress] = useState<string>();
    const [currCosmosAddress, setCurrCosmosAddress] = useState<string>();
    const [currAccountNumber, setCurrAccountNumber] = useState<number>();
    const [currChain, setCurrChain] = useState<string>();
    const [freeze, setFreeze] = useState<boolean>(true);

    // const [amountToRevoke, setAmountToRevoke] = useState<number>(0);
    // const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    // const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    // const [revokedUsers, setRevokedUsers] = useState<User[]>([]);
    // const [amounts, setAmounts] = useState<number[]>([]);
    // const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);


    const txCosmosMsg: MessageMsgFreezeAddress = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        add: freeze,
        addressRanges: [{
            start: currAccountNumber ? currAccountNumber : -1,
            end: currAccountNumber ? currAccountNumber : -1,
        }],
    };

    const handleChange = (cosmosAddress: string, newManagerAccountNumber: number, chain: string, address: string) => {
        setCurrCosmosAddress(cosmosAddress);
        setCurrAccountNumber(newManagerAccountNumber);
        setCurrAddress(address);
        setCurrChain(chain);
    }

    return (
        <TxModal
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Revoke Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgFreezeAddress}
            displayMsg={'Are you sure?'}
        >
            {/* TODO: Add freeze/unfreeze button */}
            <AddressSelect onChange={handleChange} title={"Freeze User"} />
            {children}
        </TxModal>
    );
}