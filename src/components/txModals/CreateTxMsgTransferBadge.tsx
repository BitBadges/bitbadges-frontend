import { Avatar, Divider } from 'antd';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { getFullBadgeIdRanges } from '../../bitbadges-api/badges';
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressListSelect } from '../address/AddressListSelect';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { BalancesInput } from '../common/BalancesInput';
import { TransferDisplay } from '../common/TransferDisplay';
import { TxModal } from './TxModal';
import { useAccountsContext } from '../../accounts/AccountsContext';

export function CreateTxMsgTransferBadgeModal(
    {
        collection, visible, setVisible, children, userBalance, refreshCollection, refreshUserBalance
    }: {
        collection: BitBadgeCollection,
        refreshCollection: () => void
        refreshUserBalance: () => void
        userBalance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const accounts = useAccountsContext();

    const [toAddresses, setToAddresses] = useState<BitBadgesUserInfo[]>([]);
    const [balances, setBalances] = useState<Balance[]>([
        {
            balance: 1,
            badgeIds: getFullBadgeIdRanges(collection)
        },
    ]);
    const [postTransferBalance, setPostTransferBalance] = useState<UserBalance>();

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
    }, [fromUser, collection, balances, toAddresses.length]);

    useEffect(() => {
        let postTransferBalanceObj = userBalance;
        if (fromUser.accountNumber !== chain.accountNumber) {
            postTransferBalanceObj = fromUserBalance;
        }

        if (!postTransferBalanceObj || postTransferBalanceObj === getBlankBalance()) return;


        for (const balance of balances) {
            for (const idRange of balance.badgeIds) {
                postTransferBalanceObj = getPostTransferBalance(postTransferBalanceObj, idRange.start, idRange.end, balance.balance, toAddresses.length);
            }
        }

        setPostTransferBalance(postTransferBalanceObj);
    }, [balances, userBalance, collection, toAddresses.length, fromUserBalance, chain.accountNumber, fromUser.accountNumber])

    const unregisteredUsers = toAddresses.filter((user) => user.accountNumber === -1).map((user) => user.cosmosAddress);

    const txCosmosMsg: MessageMsgTransferBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        from: fromUser ? fromUser.accountNumber : chain.accountNumber,
        transfers: [
            {
                toAddresses: toAddresses.map((user) => user.accountNumber),
                balances
            }
        ],
    };

    const onRegister = async () => {
        let allRegisteredUsers = toAddresses.filter((user) => user.accountNumber !== -1);
        let newUsersToRegister = toAddresses.filter((user) => user.accountNumber === -1);
        for (const user of newUsersToRegister) {
            const newAccountNumber = await accounts.fetchAccounts([user.cosmosAddress]).then((accountInfo) => {
                return accountInfo[0].accountNumber;
            });
            allRegisteredUsers.push({ ...user, accountNumber: newAccountNumber });
        }

        setToAddresses(allRegisteredUsers);
    }




    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        setToAddresses([]);
        setPostTransferBalance(JSON.parse(JSON.stringify(userBalance)));
    }, [visible, userBalance]);

    const forbiddenAddresses = [];

    let isManagerApprovedTransfer = false;
    const managerUnapprovedAddresses: any[] = [];

    for (const address of toAddresses) {
        for (const managerApprovedTransferMapping of collection.managerApprovedTransfers) {
            let fromIsApproved = false;
            let toIsApproved = false;

            if (managerApprovedTransferMapping.from.options === 2 && chain.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                fromIsApproved = false;
            } else {
                if (managerApprovedTransferMapping.from.options === 1) {
                    //include manager and we are the manager
                    if (chain.accountNumber === collection.manager.accountNumber) {
                        fromIsApproved = true;
                    }
                }


                for (const idRange of managerApprovedTransferMapping.from.accountNums) {
                    if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                        fromIsApproved = true;
                        break;
                    }
                }
            }

            if (managerApprovedTransferMapping.to.options === 2 && address.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                toIsApproved = false;
            } else {
                if (managerApprovedTransferMapping.to.options === 1) {
                    //include manager and we are the manager
                    if (address.accountNumber === collection.manager.accountNumber) {
                        toIsApproved = true;
                    }
                }

                for (const idRange of managerApprovedTransferMapping.to.accountNums) {
                    if (idRange.start <= address.accountNumber && idRange.end >= address.accountNumber) {
                        toIsApproved = true;
                        break;
                    }
                }
            }

            if (fromIsApproved && toIsApproved) {
                isManagerApprovedTransfer = true;
                managerUnapprovedAddresses.push(address);
            }
        }
    }

    for (const address of toAddresses) {
        for (const disallowedTransferMapping of collection.disallowedTransfers) {
            let fromIsForbidden = false;
            let toIsForbidden = false;

            if (disallowedTransferMapping.from.options === 2 && chain.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                fromIsForbidden = false;
            } else {
                if (disallowedTransferMapping.from.options === 1) {
                    //include manager and we are the manager
                    if (chain.accountNumber === collection.manager.accountNumber) {
                        fromIsForbidden = true;
                    }
                }


                for (const idRange of disallowedTransferMapping.from.accountNums) {
                    if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                        fromIsForbidden = true;
                        break;
                    }
                }
            }

            if (disallowedTransferMapping.to.options === 2 && address.accountNumber === collection.manager.accountNumber) {
                //exclude manager and we are the manager
                toIsForbidden = false;
            } else {
                if (disallowedTransferMapping.to.options === 1) {
                    //include manager and we are the manager
                    if (address.accountNumber === collection.manager.accountNumber) {
                        toIsForbidden = true;
                    }
                }

                for (const idRange of disallowedTransferMapping.to.accountNums) {
                    if (idRange.start <= address.accountNumber && idRange.end >= address.accountNumber) {
                        toIsForbidden = true;
                        break;
                    }
                }
            }

            if (fromIsForbidden && toIsForbidden) {
                forbiddenAddresses.push(address);
            }
        }
    }

    const unapprovedAddresses: any[] = [];
    for (const approvalBalance of fromUserBalance.approvals) {
        //TODO: approvals
    }


    const isUnapprovedTransfer = unapprovedAddresses.length > 0;
    const isDisallowedTransfer = forbiddenAddresses.length > 0;


    const firstStepDisabled = toAddresses.length === 0 || forbiddenAddresses.length > 0;

    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    let canTransfer = false;
    if (chain.accountNumber === collection.manager.accountNumber && isManagerApprovedTransfer) {
        canTransfer = true;
    } else if (!isDisallowedTransfer && !isUnapprovedTransfer) {
        canTransfer = true;
    }

    let badUsers = [];
    if (!canTransfer) {
        badUsers = [...forbiddenAddresses, ...unapprovedAddresses];

        if (chain.accountNumber === collection.manager.accountNumber) {
            //only show overlap between the two
            badUsers = badUsers.filter((user) => managerUnapprovedAddresses.includes(user));
        }

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
                                chain: chain.chain,
                            }}
                            hidePortfolioLink
                        />
                    </div>

                    <AddressSelect
                        currUserInfo={fromUser}
                        setCurrUserInfo={setFromUser}
                    />
                </div>
            </div >
        },
        {
            title: `Select Recipients (${toAddresses.length})`,
            description: <AddressListSelect
                users={toAddresses}
                setUsers={setToAddresses}
                disallowedUsers={badUsers}
            />,
            disabled: firstStepDisabled || !canTransfer,
        },
        {
            title: 'Select Badges and Amounts',
            description: <div>
                <br />
                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    collection={collection}
                />
                {/* <hr /> */}
                <Divider />
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            hideAddresses
                            amount={Number(balance.balance) * toAddresses.length}
                            badgeIds={balance.badgeIds}
                            collection={collection}
                            from={[{
                                chain: chain.chain,
                                address: chain.address,
                                accountNumber: chain.accountNumber,
                                cosmosAddress: chain.cosmosAddress,
                            }]}
                            to={toAddresses}
                        />
                        {/* <hr /> */}
                    </div>
                })}
                <Divider />
                {postTransferBalance && <BalanceBeforeAndAfter collection={collection} balance={fromUserBalance} newBalance={postTransferBalance} partyString='Your' beforeMessage='Before Transfer' afterMessage='After Transfer' />}
            </div>,
            disabled: secondStepDisabled
        },

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
            onSuccessfulTx={() => { refreshCollection(); refreshUserBalance(); }}
            displayMsg={<div>
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            amount={Number(balance.balance) * toAddresses.length}
                            badgeIds={balance.badgeIds}
                            collection={collection}
                            from={[fromUser]}
                            to={toAddresses}
                        />
                    </div>
                })}
            </div>}
        >
            {children}
        </TxModal>
    );
}