import React, { useEffect, useState } from 'react';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressModalDisplay, AddressModalDisplayList } from './AddressModalDisplay';
import { getAccountInformation } from '../../bitbadges-api/api';


export function CreateTxMsgTransferBadgeModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();


    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

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

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);

        //TODO: can't transfer to self
    }

    const onRegister = async () => {
        let allRegisteredUsers = toAddresses.filter((user) => user.accountNumber !== -1);

        let newUsersToRegister = toAddresses.filter((user) => user.accountNumber === -1);
        for (const user of newUsersToRegister) {
            const newAccountNumber = await getAccountInformation(user.cosmosAddress).then((accountInfo) => {
                return accountInfo.account_number;
            });
            allRegisteredUsers.push({ ...user, accountNumber: newAccountNumber });
        }

        setToAddresses(allRegisteredUsers);
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
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}
            displayMsg={
                <AddressModalDisplayList
                    users={toAddresses}
                    setUsers={setToAddresses}
                />
            }
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

                        if (value >= 0 && endSubbadgeId >= 0 && value <= endSubbadgeId) {
                            setSubbadgeRanges([{ start: value, end: endSubbadgeId }]);
                        }
                    }
                } />
            <hr />
            SubBadge ID End: <br />
            <InputNumber
                min={0}
                title='Amount to Transfer'
                value={endSubbadgeId} onChange={
                    (value: number) => {
                        setEndSubbadgeId(value);

                        if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId <= value) {
                            setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                        }
                    }
                } />
            <hr />
            <AddressSelect onChange={handleChange} title={"Add User to Transfer To"} />
            <Button type="primary"
                style={{ width: "100%" }}
                disabled={!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress}
                onClick={() => {
                    if (!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress) {
                        return;
                    };
                    setToAddresses([
                        ...toAddresses,
                        {
                            cosmosAddress: currUserInfo?.cosmosAddress,
                            accountNumber: currUserInfo?.accountNumber,
                            chain: currUserInfo?.chain,
                            address: currUserInfo?.address
                        }
                    ]);

                    setCurrUserInfo(undefined);
                }}>Add Address</Button>
            {children}
        </TxModal>
    );
}