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

            {/* <CreateTxMsgTransferBadgeModal
                badge={badge}
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
                balance={balanceInfo}
            /> */}

            {/* <CreateTxMsgRequestTransferBadgeModal
                badge={badge}
                visible={requestTransferIsVisible}
                setVisible={setRequestTransferIsVisible}
            /> */}

            {/* <CreateTxMsgHandlePendingTransferModal
                badge={badge}
                visible={handlePendingTransferIsVisible}
                setVisible={setHandlePendingTransferIsVisible}
                accept={accept}
                forcefulAccept={forcefulAccept}
                nonceRanges={nonceRanges}
            /> */}

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
