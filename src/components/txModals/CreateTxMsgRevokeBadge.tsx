import React, { useEffect, useState } from 'react';
import { MessageMsgRevokeBadge, createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from '../address/AddressSelect';
import { Button, InputNumber } from 'antd';
import { AddressDisplayList } from '../address/AddressDisplay';
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
    }, [visible]);

    const items = [
        {
            title: 'Select Users and Amounts',
            description: <>
                <div
                    style={{
                        // display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        // justifyContent: "space-between",
                        width: "100%",
                        // flexWrap: "wrap",
                    }}
                >
                    For the badges ranging
                    from IDs starting at ID #
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
                    and ending at ID #
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
                        } />,
                    revoke a balance of
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
                    for the following users:
                </div>
                <div>
                    <AddressDisplayList users={revokedUsers} setUsers={setRevokedUsers} />
                </div>
                <hr />
                <AddressSelect onChange={handleChange} title={"Add User"} />
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
            </>,
            disabled: revokedUsers.length === 0,
        }
    ]

    return (
        <TxModal
            msgSteps={items}
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            visible={visible}
            setVisible={setVisible}
            txName="Revoke Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRevokeBadge}
        >
            {children}
        </TxModal>
    );
}