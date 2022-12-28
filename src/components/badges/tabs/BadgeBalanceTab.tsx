import { Divider, Typography, Col, Row, Button } from 'antd';
import React, { useState } from 'react';
import {
    SwapOutlined,
} from '@ant-design/icons';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { BitBadgeCollection, IdRange, UserBalance } from '../../../bitbadges-api/types';
import { CreateTxMsgTransferBadgeModal } from '../../txModals/CreateTxMsgTransferBadge';
import { BlockinDisplay } from '../../blockin/BlockinDisplay';
import { CreateTxMsgHandlePendingTransferModal } from '../../txModals/CreateTxMsgHandlePendingTransferModal';
import { useChainContext } from '../../../chain/ChainContext';
import { CreateTxMsgRequestTransferBadgeModal } from '../../txModals/CreateTxMsgRequestTransferBadgeModal';
import { CreateTxMsgRequestTransferManagerModal } from '../../txModals/CreateTxMsgRequestTransferManagerModal';

const { Text } = Typography;

export function BadgeBalanceTab({ badge, balanceInfo, badgeId }: {
    badge: BitBadgeCollection | undefined;
    balanceInfo: UserBalance | undefined;
    badgeId: number | undefined;
}) {
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [requestTransferIsVisible, setRequestTransferIsVisible] = useState<boolean>(false);
    const [requestTransferManagerIsVisible, setRequestTransferManagerIsVisible] = useState<boolean>(false);
    const [handlePendingTransferIsVisible, setHandlePendingTransferIsVisible] = useState<boolean>(false);
    const [accept, setAccept] = useState<boolean>(true);
    const [forcefulAccept, setForcefulAccept] = useState<boolean>(false);
    const [nonceRanges, setNonceRanges] = useState<IdRange[]>([]);

    const chain = useChainContext();


    if (!badge || badgeId === undefined || badgeId === null) return <></>;

    if (!balanceInfo) return <>
        <div style={{ color: PRIMARY_TEXT, fontSize: 24 }}>Connect a Wallet to See Your Balances</div>
        <BlockinDisplay />
    </>;


    if (DEV_MODE) console.log("Loading BadgeBalanceTab for The Following Badge: ", badge);



    const getTableRow = (key: any, value: any) => {
        return <Row>
            <Col span={12}>
                <Text style={{ fontSize: 18, color: PRIMARY_TEXT }}>
                    {key}
                </Text>
            </Col>
            <Col span={12}>
                <Text style={{ fontSize: 18, color: PRIMARY_TEXT }}>
                    {value}
                </Text>
            </Col>
        </Row>
    }

    let currBalance = balanceInfo.balanceAmounts.find((balanceAmount) => balanceAmount.id_ranges.find((range) => {
        if (range.end === undefined) range.end = range.start;

        return range.start <= badgeId && range.end >= badgeId
    }))?.balance;
    if (!currBalance) currBalance = 0;

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <Divider></Divider>
            <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Col span={11}>
                    <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                            Balance Information
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {getTableRow("Collection Number", badge.id)}
                    {getTableRow("Badge ID", badgeId)}


                    {getTableRow("Balance", "x" + currBalance)}


                </Col>
                <Col span={11}>
                    <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                            Pending / Approvals
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {getTableRow("Approvals", balanceInfo.approvals.length ? JSON.stringify(balanceInfo.approvals) : "N/A")}
                    {getTableRow("Pending", balanceInfo.pending.map((pending) => {
                        if (pending.end === undefined) pending.end = pending.start;


                        // //An outgoingTransfer is when the balances of the badge are being transferred from the account calling this function.
                        // //This doesn't depend at all on whether it was sent by this account (could be a request) or if it is being accepted or rejected.
                        // outgoingTransfer := CurrPendingTransfer.From == CreatorAccountNum

                        // acceptIncomingTransfer := !CurrPendingTransfer.Sent && msg.Accept && !outgoingTransfer
                        // cancelOwnOutgoingTransfer := CurrPendingTransfer.Sent && !msg.Accept && outgoingTransfer
                        // rejectIncomingTransfer := !CurrPendingTransfer.Sent && !msg.Accept 


                        // finalizeOwnTransferRequestAfterApprovedByOtherParty := CurrPendingTransfer.Sent && msg.Accept && !outgoingTransfer
                        // //These two are the same scenario but split into forceful and non-forceful transfers, so manager doesn't have to pay gas for every transfer request
                        // acceptTransferRequestButMarkAsApproved := !msg.ForcefulAccept && !CurrPendingTransfer.Sent && msg.Accept && outgoingTransfer
                        // acceptTransferRequestForcefully := msg.ForcefulAccept && !CurrPendingTransfer.Sent && msg.Accept && outgoingTransfer
                        // rejectTransferRequest := !CurrPendingTransfer.Sent && !msg.Accept
                        // cancelOwnTransferRequest := CurrPendingTransfer.Sent && !msg.Accept && !outgoingTransfer

                        let outgoingTransfer = pending.from === chain.accountNumber;

                        let msg = '';
                        if (outgoingTransfer) {
                            msg += 'Sending x' + pending.amount + ' badges w/ IDs' + pending.subbadgeRange.start + ' - ' + pending.subbadgeRange.end + ' to Account #' + pending.to + '';
                        } else {
                            msg += 'Receiving x' + pending.amount + ' badges w/ IDs' + pending.subbadgeRange.start + ' - ' + pending.subbadgeRange.end + ' from Account #' + pending.from + '';
                        }

                        if (pending.subbadgeRange.start <= badgeId && pending.subbadgeRange.end >= badgeId) {
                            return <>
                                {msg}
                                <br />
                                {
                                    ((!pending.sent && !outgoingTransfer) ||
                                        (!pending.sent && outgoingTransfer && !pending.markedAsAccepted) ||
                                        (pending.sent && !outgoingTransfer)) //TODO: check other party for accepted
                                    &&
                                    <Button type="primary" onClick={() => {
                                        setAccept(true);
                                        setForcefulAccept(false);
                                        setNonceRanges([{
                                            start: pending.thisPendingNonce,
                                            end: pending.thisPendingNonce,
                                        }]);
                                        setHandlePendingTransferIsVisible(true);
                                    }}>
                                        Accept
                                    </Button>
                                }
                                <br />
                                <Button type="primary" onClick={() => {
                                    setAccept(false);
                                    setForcefulAccept(false);
                                    setNonceRanges([{
                                        start: pending.thisPendingNonce,
                                        end: pending.thisPendingNonce,
                                    }]);
                                    setHandlePendingTransferIsVisible(true);
                                }}>
                                    Reject / Cancel
                                </Button>
                                {/* cosmos1h9k87d2h6hlygq0tgja3ufw2v6638skjcha7qw */}
                            </>
                        }
                    }))}
                </Col>
            </Row>

            <Button
                style={{
                    marginTop: '10px',
                    width: '100%',
                }}
                type="primary"
                onClick={() => {
                    setTransferIsVisible(true);
                }}>
                <SwapOutlined />
                <Text strong style={{ fontSize: 18, color: 'white' }}>
                    Transfer
                </Text>
            </Button>
            <Button
                style={{
                    marginTop: '10px',
                    width: '100%',
                }}
                type="primary"
                onClick={() => {
                    setRequestTransferIsVisible(true);
                }}>
                <SwapOutlined />
                <Text strong style={{ fontSize: 18, color: 'white' }}>
                    Request Transfer
                </Text>
            </Button>

            <Button
                style={{
                    marginTop: '10px',
                    width: '100%',
                }}
                type="primary"
                onClick={() => {
                    setRequestTransferManagerIsVisible(true);
                }}>
                <SwapOutlined />
                <Text strong style={{ fontSize: 18, color: 'white' }}>
                    Request Transfer Manager
                </Text>
            </Button>

            <CreateTxMsgTransferBadgeModal
                badge={badge}
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
                balance={balanceInfo}
            />

            <CreateTxMsgRequestTransferBadgeModal
                badge={badge}
                visible={requestTransferIsVisible}
                setVisible={setRequestTransferIsVisible}
            />

            <CreateTxMsgHandlePendingTransferModal
                badge={badge}
                visible={handlePendingTransferIsVisible}
                setVisible={setHandlePendingTransferIsVisible}
                accept={accept}
                forcefulAccept={forcefulAccept}
                nonceRanges={nonceRanges}
            />

            <CreateTxMsgRequestTransferManagerModal
                badge={badge}
                visible={requestTransferManagerIsVisible}
                setVisible={setRequestTransferManagerIsVisible}
            />

            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(balanceInfo, null, 2)}
                </pre>
            }
        </div >
    );
}
