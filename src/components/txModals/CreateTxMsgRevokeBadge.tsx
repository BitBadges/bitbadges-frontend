import React, { useEffect, useState } from 'react';
import { MessageMsgRevokeBadge, createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';
import { getAccountInformation } from '../../bitbadges-api/api';


export function CreateTxMsgRevokeBadgeModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();

    const [amountToRevoke, setAmountToRevoke] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    const [revokedUsers, setRevokedUsers] = useState<BitBadgesUserInfo[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const unregisteredUsers = revokedUsers.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgRevokeBadge = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        addresses: revokedUsers.map((user) => user.accountNumber),
        amounts,
        subbadgeRanges,
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }

    const onRegister = async () => {
        let allRegisteredUsers = revokedUsers.filter((user) => user.accountNumber !== -1);

        let newUsersToRegister = revokedUsers.filter((user) => user.accountNumber === -1);
        for (const user of newUsersToRegister) {
            const newAccountNumber = await getAccountInformation(user.cosmosAddress).then((accountInfo) => {
                return accountInfo.account_number;
            });
            allRegisteredUsers.push({ ...user, accountNumber: newAccountNumber });
        }

        setRevokedUsers(allRegisteredUsers);
    }

    useEffect(() => {
        setRevokedUsers([]);
        setAmounts([]);
        setSubbadgeRanges([]);
        setAmountToRevoke(0);
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
            txName="Revoke Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRevokeBadge}
            displayMsg={<div>You are revoking this badge from these users:
                {revokedUsers.map((user, index) => {
                    return (
                        <div key={index}>
                            <AddressModalDisplay
                                title={"User " + (index + 1)}
                                userInfo={user ? user : {} as BitBadgesUserInfo}
                            />
                        </div>
                    )
                })}
            </div>}
            disabled={revokedUsers.length === 0}
        >
            Amount to Revoke: <br />
            <InputNumber
                min={0}
                title='Amount to Revoke'
                value={amountToRevoke} onChange={
                    (value: number) => {
                        if (!value || value <= 0) {
                            setAmountToRevoke(0);
                            setAmounts([0]);
                        }
                        else {
                            setAmountToRevoke(value);
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
                title='Amount to Revoke'
                value={endSubbadgeId} onChange={
                    (value: number) => {
                        setEndSubbadgeId(value);

                        if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId < value) {
                            setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                        }
                    }
                } />
            <hr />
            <AddressSelect onChange={handleChange} title={"Add User to Revoke From"} />
            <Button type="primary"
                style={{ width: "100%" }}
                disabled={!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress}
                onClick={() => {
                    if (!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress) {
                        return;
                    };
                    setRevokedUsers([
                        ...revokedUsers,
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