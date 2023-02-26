import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Steps } from 'antd';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { BitBadgeCollection, BitBadgesUserInfo, DistributionMethod, Transfers, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { TransferDisplay } from '../common/TransferDisplay';
import { TransferSelect } from '../common/TransferSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferBadgeModal(
    {
        collection, visible, setVisible, children, userBalance, refreshUserBalance
    }: {
        collection: BitBadgeCollection,
        refreshUserBalance: () => void
        userBalance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
    }
) {
    const chain = useChainContext();
    const accounts = useAccountsContext();
    const collections = useCollectionsContext();

    const [transfers, setTransfers] = useState<(Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]>([]);

    const [fromUser, setFromUser] = useState<BitBadgesUserInfo>({
        cosmosAddress: chain.cosmosAddress,
        accountNumber: chain.accountNumber,
        address: chain.address,
        chain: chain.chain,
    });

    const [fromUserBalance, setFromUserBalance] = useState<UserBalance>(userBalance);

    useEffect(() => {
        setFromUser({
            cosmosAddress: chain.cosmosAddress,
            accountNumber: chain.accountNumber,
            address: chain.address,
            chain: chain.chain,
        });
    }, [chain.cosmosAddress, chain.accountNumber, chain.address, chain.chain]);


    useEffect(() => {
        async function getFromUserBalance() {
            if (!fromUser) return;
            const balanceRes = await getBadgeBalance(collection.collectionId, fromUser.accountNumber);
            if (!balanceRes?.balance) return;
            setFromUserBalance(balanceRes.balance);
        }
        getFromUserBalance();
    }, [fromUser, collection]);

    const unregisteredUsers: string[] = [];
    for (const transfer of transfers) {
        for (const toAddress of transfer.toAddresses) {
            accounts.fetchAccountsByNumber([toAddress]);
            const account = accounts.accounts[toAddress];
            if (account.accountNumber === -1) unregisteredUsers.push(account.cosmosAddress);
        }
    }

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        from: fromUser ? fromUser.accountNumber : chain.accountNumber,
        transfers: transfers
    };

    const onRegister = async () => {
        console.log(unregisteredUsers);

        const newAccounts = await accounts.fetchAccounts(unregisteredUsers, true);

        console.log(newAccounts);

        const newTransfers = [];
        for (const transfer of transfers) {
            const newAddresses = [];

            for (const toAddress of transfer.toAddressInfo) {

                if (toAddress.accountNumber !== -1) {
                    newAddresses.push(toAddress);
                    continue;
                }
                const user = newAccounts.find((account) => account.cosmosAddress === toAddress.cosmosAddress)
                console.log("USER: ", user);
                if (user) newAddresses.push(user);
            }
            newTransfers.push({
                ...transfer,
                toAddresses: newAddresses.map((address) => address.accountNumber),
                toAddressInfo: newAddresses
            });
        }
        setTransfers(newTransfers);
    }




    const items = [
        {
            title: 'Select Sender',
            description: <div>
                <div
                    style={{
                        padding: '0',
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 20,
                    }}
                >
                    <Avatar
                        size={150}
                        src={
                            <Blockies
                                seed={fromUser.address.toLowerCase()}
                                size={40}
                            />
                        }
                    />

                    <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                        <AddressDisplay
                            userInfo={{
                                cosmosAddress: fromUser.cosmosAddress,
                                accountNumber: fromUser.accountNumber,
                                address: fromUser.address,
                                chain: fromUser.chain,
                            }}
                            hidePortfolioLink
                            darkMode
                        />
                    </div>

                    {fromUser.address != chain.address && <div style={{}}>
                        <br />
                        <InfoCircleOutlined /> If you select an address other than yours, you must be approved to transfer on their behalf.
                    </div>}

                    <AddressSelect
                        currUserInfo={fromUser}
                        setCurrUserInfo={setFromUser}
                        darkMode
                        hideAddressDisplay
                    />

                </div>
            </div >
        },
        {
            title: 'Add Transfers',
            description: <div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <TransferSelect
                        collection={collection}
                        fromUser={fromUser}
                        userBalance={fromUserBalance}
                        setTransfers={setTransfers}
                        transfers={transfers}
                        distributionMethod={DistributionMethod.Whitelist}
                    />
                </div >
            </div >,
            disabled: transfers.length === 0
        }
    ];

    return (
        <TxModal
            msgSteps={items}
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
            visible={visible}
            setVisible={setVisible}
            txName="Transfer Badge(s)"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgTransferBadge}
            onSuccessfulTx={async () => { collections.refreshCollection(collection.collectionId); refreshUserBalance(); }}
            displayMsg={<div style={{ color: PRIMARY_TEXT }}>
                <TransferDisplay
                    transfers={transfers}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    from={[fromUser]}
                    setTransfers={setTransfers}
                />
            </div>}
        >
            {children}
        </TxModal>
    );
}