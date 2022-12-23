import { Address } from '../Address';
import { Avatar, Tooltip, Divider, Alert, Typography, Col, Row, Table, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faUserLock } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import {
    SwapOutlined,
    CheckCircleFilled,
    WarningFilled,
    LockFilled,
    UnlockFilled,
    RollbackOutlined,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { BitBadge, BitBadgeCollection, IdRange, UserBalance } from '../../bitbadges-api/types';
import { ColumnsType } from 'antd/lib/table';
import { Permissions } from '../../bitbadges-api/permissions';
import { CreateTxMsgTransferBadgeModal } from '../txModals/CreateTxMsgTransferBadge';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { MessageMsgHandlePendingTransfer } from 'bitbadgesjs-transactions';
import { CreateTxMsgHandlePendingTransferModal } from '../txModals/CreateTxMsgHandlePendingTransferModal';

const { Text } = Typography;


export function BadgeBalanceTab({ badge, balanceInfo, badgeId }: {
    badge: BitBadgeCollection | undefined;
    balanceInfo: UserBalance | undefined;
    badgeId: number | undefined;
}) {
    const [transferIsVisible, setTransferIsVisible] = useState<boolean>(false);
    const [handlePendingTransferIsVisible, setHandlePendingTransferIsVisible] = useState<boolean>(false);
    const [accept, setAccept] = useState<boolean>(true);
    const [forcefulAccept, setForcefulAccept] = useState<boolean>(false);
    const [nonceRanges, setNonceRanges] = useState<IdRange[]>([]);


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

                        if (pending.subbadgeRange.start <= badgeId && pending.subbadgeRange.end >= badgeId) {
                            if (pending.sent && !pending.markedAsAccepted) {
                                return <>
                                    {"Sending x" + pending.amount + " badges w/ IDs" + pending.subbadgeRange.start + " - " + pending.subbadgeRange.end + " to Account #" + pending.to +
                                        ""}
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
                                        Cancel
                                    </Button>
                                </>;
                            }

                            return JSON.stringify(pending);
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

            <CreateTxMsgTransferBadgeModal
                badge={badge}
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
            />

            <CreateTxMsgHandlePendingTransferModal
                badge={badge}
                visible={handlePendingTransferIsVisible}
                setVisible={setHandlePendingTransferIsVisible}
                accept={accept}
                forcefulAccept={forcefulAccept}
                nonceRanges={nonceRanges}
            />

            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(balanceInfo, null, 2)}
                </pre>
            }
        </div >
    );
}
