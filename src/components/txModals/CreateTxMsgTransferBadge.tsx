import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


export function CreateTxMsgTransferBadgeModal({ badge, visible, setVisible, children }
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

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    const [toAddresses, setToAddresses] = useState<User[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);


    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        from: chain.accountNumber,
        badgeId: badge.id,
        toAddresses: toAddresses.map((user) => user.accountNumber),
        amounts,
        subbadgeRanges,
        expiration_time: 0, //TODO:
        cantCancelBeforeTime: 0,
    };

    const handleChange = (cosmosAddress: string, newManagerAccountNumber: number, chain: string, address: string) => {
        setCurrCosmosAddress(cosmosAddress);
        setCurrAccountNumber(newManagerAccountNumber);
        setCurrAddress(address);
        setCurrChain(chain);

        //TODO: can't transfer to self
    }

    useEffect(() => {
        setToAddresses([]);
        setAmounts([]);
        setSubbadgeRanges([]);
        setAmountToTransfer(0);
        setStartSubbadgeId(-1);
        setEndSubbadgeId(-1);
    }, [visible])

    return (
        <TxModal
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}
            displayMsg={<div>You are revoking this badge from these users:
                {toAddresses.map((user, index) => {
                    return (
                        <div key={index}>
                            <AddressModalDisplay
                                title={"User " + (index + 1)}
                                cosmosAddress={user.cosmosAddress}
                                accountNumber={user.accountNumber}
                                chain={user.chain}
                                address={user.address}
                            />
                            {/* {index === toAddresses.length - 1 && <hr />} */}
                        </div>
                    )
                })}
            </div>}
            disabled={toAddresses.length === 0}
        >
            Amount to Transfer: <br />
            <InputNumber
                min={0}
                title='Amount to Transfer'
                value={amountToTransfer} onChange={
                    (value: number) => {
                        if (!value || value <= 0) {
                            setAmountToTransfer(0);
                            setAmounts([0]);
                        }
                        else {
                            setAmountToTransfer(value);
                            setAmounts([value]);
                        }
                    }
                } />
            <hr />
            SubBadge ID Start: <br />
            <InputNumber
                min={0}
                value={startSubbadgeId} onChange={
                    (value: number) => {
                        setStartSubbadgeId(value);

                        if (value >= 0 && endSubbadgeId >= 0 && value < endSubbadgeId) {
                            setSubbadgeRanges([{ start: value, end: endSubbadgeId }]);
                        }
                    }
                } />
            <hr />
            SubBadge ID End: <br />
            <InputNumber
                min={0}
                title='Amount to Trasfer'
                value={endSubbadgeId} onChange={
                    (value: number) => {
                        setEndSubbadgeId(value);

                        if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId < value) {
                            setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                        }
                    }
                } />
            <hr />
            <AddressSelect onChange={handleChange} title={"Add User to Transfer To"} />
            <Button type="primary"
                style={{ width: "100%" }}
                disabled={!currAddress || !currAccountNumber || !currChain || !currCosmosAddress}
                onClick={() => {
                    if (!currAddress || !currAccountNumber || !currChain || !currCosmosAddress) return;
                    setToAddresses([
                        ...toAddresses,
                        {
                            cosmosAddress: currCosmosAddress,
                            accountNumber: currAccountNumber,
                            chain: currChain,
                            address: currAddress
                        }
                    ]);

                    setCurrAccountNumber(undefined);
                    setCurrAddress(undefined);
                    setCurrChain(undefined);
                    setCurrCosmosAddress(undefined);
                }}>Add Address</Button>
            {children}
        </TxModal>
    );
}