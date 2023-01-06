import React, { useEffect, useState } from 'react';
import { MessageMsgRequestTransferBadge, MessageMsgTransferBadge, createTxMsgRequestTransferBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, BitBadgesUserInfo, IdRange, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from '../address/AddressSelect';
import { Divider, InputNumber, Switch, Typography } from 'antd';
import { getAccountInformation, getBadgeBalance } from '../../bitbadges-api/api';
import { BadgeAvatar } from '../badges/BadgeAvatar';
import { getPostTransferBalance } from '../../bitbadges-api/balances';
import { BalanceBeforeAndAfter } from '../common/BalanceBeforeAndAfter';
import { TransferDisplay } from '../common/TransferDisplay';
import { AddressDisplay } from '../address/AddressDisplay';


export function CreateTxMsgRequestTransferBadgeModal({ badge, visible, setVisible, children, balance }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        balance: UserBalance,
    }) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();
    const [requestingFromManager, setRequestingFromManager] = useState<boolean>(true);

    const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
    const [startSubbadgeId, setStartSubbadgeId] = useState<number>(0);
    const [endSubbadgeId, setEndSubbadgeId] = useState<number>(0);

    const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);

    const [requestedBalance, setRequestedBalance] = useState<UserBalance>();

    const [newBalance, setNewBalance] = useState<UserBalance>(balance);

    useEffect(() => {
        if (!requestedBalance || !requestedBalance.balanceAmounts) return;

        try {
            let newBalanceObj = getPostTransferBalance(requestedBalance, badge, startSubbadgeId, endSubbadgeId, amountToTransfer, 1);

            setNewBalance(newBalanceObj);
        } catch (e) {
            setNewBalance({
                ...requestedBalance,
                balanceAmounts: [],
            });
        }
    }, [amountToTransfer, startSubbadgeId, endSubbadgeId, badge, requestedBalance])

    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!badge || !currUserInfo?.accountNumber || currUserInfo?.accountNumber < 0 || !badge.id) {
                return;
            }
            const balanceInfoRes = await getBadgeBalance(badge.id, currUserInfo?.accountNumber);

            if (balanceInfoRes.error) {
                console.error("Error getting balance: ", balanceInfoRes.error);
            } else {
                console.log("Got balance: ", balanceInfoRes.balanceInfo);
                const balanceInfo = balanceInfoRes.balanceInfo;
                setRequestedBalance(balanceInfo)
            }
        }
        getBadgeBalanceFromApi();
    }, [badge, currUserInfo?.accountNumber])



    const txCosmosMsg: MessageMsgRequestTransferBadge = {
        creator: chain.cosmosAddress,
        from: requestingFromManager ? badge.manager.accountNumber : currUserInfo?.accountNumber ? currUserInfo.accountNumber : -1,
        badgeId: badge.id,
        amount: amountToTransfer,
        subbadgeRanges,
        expiration_time: 0, //TODO:
        cantCancelBeforeTime: 0,
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }

    const onRegister = async () => {
        if (currUserInfo?.cosmosAddress) {
            const newAccountNumber = await getAccountInformation(currUserInfo.cosmosAddress).then((accountInfo) => {
                return accountInfo.account_number;
            });
            setCurrUserInfo({ ...currUserInfo, accountNumber: newAccountNumber });
        }
    }

    //Reset states upon modal close
    useEffect(() => {
        setSubbadgeRanges([]);
        setAmountToTransfer(0);
        setStartSubbadgeId(0);
        setEndSubbadgeId(0);
        setCurrUserInfo(undefined);
        setRequestedBalance(undefined);
        setNewBalance(balance);
        setRequestingFromManager(true);
    }, [visible, balance])

    const firstStepDisabled = !requestingFromManager && (!currUserInfo || !currUserInfo.cosmosAddress);
    const secondStepDisabled = amountToTransfer <= 0 || startSubbadgeId < 0 || endSubbadgeId < 0 || startSubbadgeId > endSubbadgeId || !!newBalance?.balanceAmounts.find((balance) => balance.balance < 0);;

    const items = [
        {
            title: `Select User to Request From`,
            description: <div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Request From Manager?
                    <Switch
                        checked={requestingFromManager}
                        onChange={(v) => {
                            setRequestingFromManager(v);
                        }}
                        title='Amount to Transfer'

                    />
                </div>
                {
                    requestingFromManager && <AddressDisplay userInfo={badge.manager} />
                }
                {
                    !requestingFromManager && <>
                        <Divider />
                        <AddressSelect onChange={handleChange} title={"Select User"} />
                    </>
                }
            </div>,
            disabled: firstStepDisabled,
        },
        {
            title: 'Select IDs and Amounts',
            description: <div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Amount to Transfer:
                    <InputNumber
                        min={1}
                        title='Amount to Transfer'
                        value={amountToTransfer} onChange={
                            (value: number) => {
                                if (!value || value <= 0) {
                                    setAmountToTransfer(0);
                                }
                                else {
                                    setAmountToTransfer(value);
                                }
                            }
                        } />
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID Start:
                    <InputNumber
                        min={0}
                        max={endSubbadgeId}
                        value={startSubbadgeId} onChange={
                            (value: number) => {
                                setStartSubbadgeId(value);

                                if (value >= 0 && endSubbadgeId >= 0 && value <= endSubbadgeId) {
                                    setSubbadgeRanges([{ start: value, end: endSubbadgeId }]);
                                }
                            }
                        } />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    Badge ID End:
                    <InputNumber
                        min={0}
                        max={badge.nextSubassetId - 1}
                        title='Amount to Transfer'
                        value={endSubbadgeId} onChange={
                            (value: number) => {
                                setEndSubbadgeId(value);

                                if (startSubbadgeId >= 0 && value >= 0 && startSubbadgeId <= value) {
                                    setSubbadgeRanges([{ start: startSubbadgeId, end: value }]);
                                }
                            }
                        } />
                </div>
                <hr />

                <TransferDisplay
                    badge={badge}
                    startId={startSubbadgeId}
                    endId={endSubbadgeId}
                    amount={amountToTransfer}
                    from={[currUserInfo ? currUserInfo : {} as BitBadgesUserInfo]}
                    to={[{
                        cosmosAddress: chain.cosmosAddress,
                        accountNumber: chain.accountNumber,
                        address: chain.address,
                        chain: chain.chain,
                    }]}
                />
                <hr />
                <BalanceBeforeAndAfter
                    balance={requestedBalance ? requestedBalance : {} as UserBalance}
                    newBalance={newBalance}
                    partyString={`This User's`}
                />
            </div>,
            disabled: secondStepDisabled
        },
    ];

    let unregisteredUsers: string[] = [];
    if (currUserInfo && currUserInfo.cosmosAddress && currUserInfo.accountNumber < 0) {
        unregisteredUsers = [currUserInfo.cosmosAddress];
    }
    return (
        <TxModal
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Request Transfer Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRequestTransferBadge}
            displayMsg={
                <div style={{ textAlign: 'left' }}>
                    The requested user will have three options:
                    <ol>
                        <li>
                            Accept this request and complete the transfer themselves.
                        </li>
                        <li>
                            Approve this request,
                            and then, you can complete the transfer with a separate transaction.
                        </li>
                        <li>
                            Reject this request.
                        </li>
                    </ol>
                </div>
            }
        // disabled={currUserInfo === undefined || currUserInfo === null || currUserInfo.accountNumber < 0}
        >
            {children}
        </TxModal>
    );
}