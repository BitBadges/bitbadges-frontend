import { Avatar, Divider } from 'antd';
import { MessageMsgTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { useAccountsContext } from '../../accounts/AccountsContext';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { getFullBadgeIdRanges } from '../../bitbadges-api/badges';
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';
import { Balance, BitBadgeCollection, BitBadgesUserInfo, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { useCollectionsContext } from '../../collections/CollectionsContext';
import { PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressListSelect } from '../address/AddressListSelect';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { BalancesInput } from '../common/BalancesInput';
import { IdRangesInput } from '../common/IdRangesInput';
import { TransferDisplay } from '../common/TransferDisplay';
import { TxModal } from './TxModal';
import { InfoCircleOutlined, InfoOutlined } from '@ant-design/icons';

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
        console.log(unregisteredUsers);

        const newAccounts = await accounts.fetchAccounts(unregisteredUsers, true);

        console.log(newAccounts);

        const newAddresses = [];
        for (const toAddress of toAddresses) {
            if (toAddress.accountNumber !== -1) {
                newAddresses.push(toAddress);
                continue;
            }
            const user = newAccounts.find((account) => account.cosmosAddress === toAddress.cosmosAddress)
            console.log("USER: ", user);
            if (user) newAddresses.push(user);
        }
        console.log("NEW ADDRESSES: ", newAddresses);
        setToAddresses(newAddresses);
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


    const firstStepDisabled = toAddresses.length === 0;

    const secondStepDisabled = balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.balance < 0);

    let canTransfer = false;
    if (chain.accountNumber === collection.manager.accountNumber && isManagerApprovedTransfer) {
        canTransfer = true;
    } else if (!isDisallowedTransfer && !isUnapprovedTransfer) {
        canTransfer = true;
    }

    let messages: string[] = [];
    let badUsers = [];

    for (const address of toAddresses) {
        if (address.cosmosAddress === fromUser.cosmosAddress) {
            messages.push('Recipient cannot equal sender.');
            badUsers.push({
                address: chain.address,
                cosmosAddress: chain.cosmosAddress,
                accountNumber: chain.accountNumber,
                chain: chain.chain,
            });
            canTransfer = false;
        }
    }

    if (!canTransfer) {
        for (const address of forbiddenAddresses) {
            messages.push(`Transfer to this recipient has been disallowed by the manager.`);
        }

        for (const address of unapprovedAddresses) {
            messages.push(`You are not approved to transfer on behalf of the sender.`);
        }

        badUsers.push(...forbiddenAddresses, ...unapprovedAddresses);

        if (chain.accountNumber === fromUser.accountNumber && chain.accountNumber === collection.manager.accountNumber) {
            //only show overlap between the two
            badUsers = badUsers.filter((user, idx) => {
                if (managerUnapprovedAddresses.includes(user)) {
                    //filter out the messages that has an index of idx
                    messages = messages.filter((_, index) => index !== idx);
                    return true;
                }

                return false;
            });
        }

        console.log('badUsers', badUsers);
        if (badUsers.length === 0) {
            canTransfer = true;
        }
    }

    const idRangesOverlap = balances[0].badgeIds.some(({ start, end }, i) => {
        const start1 = start;
        const end1 = end
        return balances[0].badgeIds.some(({ start, end }, j) => {
            const start2 = start;
            const end2 = end;
            if (i === j) {
                return false;
            }
            return start1 <= end2 && start2 <= end1;
        });
    });



    //TODO: Add helper messages about account being frozen / manager transfers in this card; catch it earlier
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
            title: `Select Recipients (${toAddresses.length})`,
            description: <AddressListSelect
                users={toAddresses}
                setUsers={setToAddresses}
                disallowedUsers={badUsers}
                disallowedMessages={messages}
                darkMode
            />,
            disabled: firstStepDisabled || !canTransfer,
        },
        {
            title: 'Select Badges',
            description: <div>
                <br />
                <IdRangesInput
                    setIdRanges={(badgeIds) => {
                        setBalances([
                            {
                                balance: balances[0]?.balance || 0,
                                badgeIds
                            }
                        ]);
                    }}
                    maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
                    darkMode
                />

                <Divider />
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            fontColor={PRIMARY_TEXT}
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
                            hideBalances={true}
                        />
                        {/* <hr /> */}
                    </div>
                })}
            </div>,
            disabled: idRangesOverlap || firstStepDisabled || !canTransfer,
        },
        {
            title: 'Select Amounts',
            description: <div>
                <br />
                <BalancesInput
                    balances={balances}
                    setBalances={setBalances}
                    collection={collection}
                    darkMode
                />
                {/* <hr /> */}
                <Divider />
                {balances.map((balance, index) => {
                    // console.log(balance);
                    return <div key={index}>
                        <TransferDisplay
                            fontColor={PRIMARY_TEXT}
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
            disabled: idRangesOverlap || secondStepDisabled
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
            onSuccessfulTx={async () => { collections.refreshCollection(collection.collectionId); refreshUserBalance(); }}
            displayMsg={<div>
                {balances.map((balance, index) => {

                    return <div key={index} style={{ color: PRIMARY_TEXT }}>
                        <br />
                        <TransferDisplay
                            amount={Number(balance.balance) * toAddresses.length}
                            badgeIds={balance.badgeIds}
                            collection={collection}
                            from={[fromUser]}
                            to={toAddresses}
                            fontColor={PRIMARY_TEXT}
                        />
                    </div>
                })}
            </div>}
        >
            {children}
        </TxModal>
    );
}