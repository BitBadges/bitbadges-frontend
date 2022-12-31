import { Address } from '../Address';
import { Divider, Typography, Col, Row, Table } from 'antd';
import React from 'react';
import {
    CheckCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { Permissions } from '../../bitbadges-api/permissions';

const { Text } = Typography;


export function CollectionOverview({ badge, metadata, balance }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
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
                            Collection Info
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {getTableRow("Collection ID", badge.id)}
                    {getTableRow("Type", badge.standard == 0 ? "BitBadge" : "Unknown")}
                    {badge.manager && getTableRow("Manager", <Address
                        chain='eth'
                        address={badge.manager.split(':')[1]}
                        fontColor="lightgrey"
                        fontSize={18}
                    />)}
                    {metadata?.description && getTableRow("Description", metadata.description)}
                    {/* {getTableRow("Sub-Badges", subassetSupplyComponent)} */}
                    {badge.uri && getTableRow("URI", <a href={badge.uri.uri} target="_blank" rel="noreferrer">{badge.uri.uri}</a>)}
                    {badge.arbitraryBytes && getTableRow("Arbitrary Bytes", badge.arbitraryBytes)}
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
                            {JSON.stringify(badge, null, 2)}
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
                            Permissions
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {Object.keys(badge.permissions).map((permission) => {
                        return getTableRow(permission, badge.permissions[permission as keyof Permissions] ? 'true' : 'false')
                    })}
                    {badge.freezeRanges?.length > 0 && getTableRow("Freeze Ranges", badge.freezeRanges.map((freezeRange) => {
                        return <>{freezeRange.start}-{freezeRange.end}</>
                    }))}
                </Col>
            </Row >

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
                    {balance?.balanceAmounts?.map((balanceAmount) => {
                        return balanceAmount.id_ranges.map((idRange) => {
                            return getTableRow('x' + balanceAmount.balance, `IDs: ${idRange.start}-${idRange.end}`)
                        })
                    })}
                </Col>
            </Row >

        </div >
    );
}
