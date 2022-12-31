import { Address } from '../address/Address';
import { Divider, Typography, Col, Row, Table } from 'antd';
import React from 'react';
import {
    CheckCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { Permissions } from '../../bitbadges-api/permissions';

const { Text } = Typography;


export function BadgeOverview({ badge, metadata, balance, badgeId }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
    badgeId: number
}) {
    if (!badge || !metadata) return <></>

    let endTimestamp = MAX_DATE_TIMESTAMP;
    let validForever = true;
    if (metadata?.validFrom?.end) {
        endTimestamp = metadata.validFrom.end;
        validForever = false;
    }

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp
    ).toLocaleDateString();

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


    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <Row style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Col style={{ width: '100%' }}>
                    {/* <Col span={11}> */}
                    <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                            Badge Info
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {getTableRow("Badge ID", badgeId)}

                    {metadata?.description && getTableRow("Description", metadata.description)}
                    {getTableRow("Expiration",
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {`Valid ${metadata?.validFrom?.end && metadata?.validFrom?.end !== MAX_DATE_TIMESTAMP
                                ? 'Until ' +
                                endDateString
                                : 'Forever'
                                }`}
                            <Divider type="vertical" />
                            {Date.now() <= endTimestamp ? (
                                <CheckCircleFilled
                                    style={{
                                        fontSize: 30,
                                        color: 'green',
                                    }}
                                />
                            ) : (
                                <WarningFilled
                                    style={{
                                        fontSize: 30,
                                        color: 'red',
                                    }}
                                />
                            )}


                        </div>

                    )}


                    {DEV_MODE &&
                        <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    }
                </Col>
            </Row>

            <Row style={{ display: 'flex', justifyContent: 'center', width: '100%' }}  >
                <Col style={{ justifyContent: 'center', width: '100%' }}>
                    {/* </Col>
                <Col span={11}> */}
                    <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                            Your Balances
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    You own x{balance?.balanceAmounts?.find((balanceAmount) => balanceAmount.id_ranges.find((range) => {
                        if (range.end === undefined) range.end = range.start;

                        return range.start <= badgeId && range.end >= badgeId
                    }))?.balance ?? 0} of this badge
                </Col>
            </Row >

        </div >
    );
}
