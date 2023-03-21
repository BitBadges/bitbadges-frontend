import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Divider } from 'antd';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { BitBadgeCollection, BitBadgesUserInfo, TransfersExtended, UserBalance } from '../../bitbadges-api/types';
import { PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { TransferSelect } from '../transfers/TransferSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferBadgeModal(
    {
        collection, visible, setVisible, children, userBalance, refreshUserBalance
    }: {
        collection: BitBadgeCollection,
        refreshUserBalance: () => Promise<void>,
        userBalance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
    }
) {
    const chain = useChainContext();
    const accounts = useAccountsContext();
    const collections = useCollectionsContext();

    const [transfers, setTransfers] = useState<TransfersExtended[]>([]);
    const [sender, setSender] = useState<BitBadgesUserInfo>({
        cosmosAddress: chain.cosmosAddress,
        accountNumber: chain.accountNumber,
        address: chain.address,
        chain: chain.chain,
    });
    const [senderBalance, setSenderBalance] = useState<UserBalance>(userBalance);

    useEffect(() => {
        setSender({
            cosmosAddress: chain.cosmosAddress,
            accountNumber: chain.accountNumber,
            address: chain.address,
            chain: chain.chain,
        });
    }, [chain.cosmosAddress, chain.accountNumber, chain.address, chain.chain]);

    useEffect(() => {
        async function getSenderBalance() {
            const balanceRes = await getBadgeBalance(collection.collectionId, sender.accountNumber);
            if (!balanceRes?.balance) return;
            setSenderBalance(balanceRes.balance);
        }
        getSenderBalance();
    }, [sender.accountNumber, collection]);

    useEffect(() => {
        for (const transfer of transfers) {
            accounts.fetchAccountsByNumber(transfer.toAddresses);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transfers]);

    const unregisteredUsers: string[] = [];
    for (const transfer of transfers) {
        for (const account of transfer.toAddressInfo ?? []) {
            if (account?.accountNumber === -1) unregisteredUsers.push(account.cosmosAddress);
        }
    }

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        from: sender ? sender.accountNumber : chain.accountNumber,
        transfers: transfers
    };

    const onRegister = async () => {
        const newAccounts = await accounts.fetchAccounts(unregisteredUsers, true);

        const newTransfers = [];
        for (const transfer of transfers) {
            const newAddresses = [];
            for (const toAddress of transfer.toAddressInfo ?? []) {
                if (toAddress?.accountNumber !== -1) {
                    newAddresses.push(toAddress);
                    continue;
                }
                const user = newAccounts.find((account) => account.cosmosAddress === toAddress.cosmosAddress)
                if (user) newAddresses.push(user);
            }

            newTransfers.push({
                ...transfer,
                toAddresses: newAddresses.map((address) => address?.accountNumber ?? -1),
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
                                seed={sender.address.toLowerCase()}
                                size={40}
                            />
                        }
                    />

                    <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                        <AddressDisplay
                            userInfo={{
                                cosmosAddress: sender.cosmosAddress,
                                accountNumber: sender.accountNumber,
                                address: sender.address,
                                chain: sender.chain,
                                name: sender.name,
                            }}
                            hidePortfolioLink
                            darkMode
                        />
                    </div>

                    {sender.address != chain.address && <div style={{}}>
                        <br />
                        <InfoCircleOutlined /> If you select an address other than yours, you must be approved to transfer on their behalf.
                    </div>}

                    <AddressSelect
                        currUserInfo={sender}
                        setCurrUserInfo={setSender}
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
                        sender={sender}
                        userBalance={senderBalance}
                        setTransfers={setTransfers}
                        transfers={transfers}
                        plusButton
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
            onSuccessfulTx={async () => { await collections.refreshCollection(collection.collectionId); await refreshUserBalance(); }}
            displayMsg={<div style={{ color: PRIMARY_TEXT }}>
                <TransferDisplay
                    transfers={transfers}
                    collection={collection}
                    fontColor={PRIMARY_TEXT}
                    from={[sender]}
                    setTransfers={setTransfers}
                />
                <Divider />
            </div>}
        >
            {children}
        </TxModal>
    );
}