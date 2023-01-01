import { Divider, Typography, Col, Row, Table, Tag } from 'antd';
import React from 'react';
import {
    CheckCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { AddressModalDisplay } from '../address/AddressModalDisplay';
import { useChainContext } from '../../chain/ChainContext';
import { TableRow } from '../common/TableRow';

const { Text } = Typography;


export function CollectionOverview({ badge, metadata, balance }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    balance: UserBalance | undefined;
}) {
    const chain = useChainContext();
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
                    <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                    {<TableRow label={"Collection ID"} value={badge.id} labelSpan={9} valueSpan={15} />}
                    {<TableRow label={"Type"} value={badge.standard == 0 ? "BitBadge" : "Unknown"} labelSpan={9} valueSpan={15} />}
                    {badge.manager && <TableRow label={"Manager"} value={<div style={{ justifyContent: 'right', textAlign: 'right' }}>
                        <AddressModalDisplay
                            fontSize={14}
                            fontColor={SECONDARY_TEXT}
                            // userInfo={badge?.manager}
                            userInfo={{
                                address: chain.address,
                                chain: chain.chain,
                                accountNumber: chain.accountNumber,
                                cosmosAddress: chain.cosmosAddress,
                            }}
                            hideChains
                        />
                    </div>} labelSpan={9} valueSpan={15} />}
                    {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
                    {/* {<TableRow label={} value={} labelSpan={9} valueSpan={15} />"Sub-Badges", subassetSupplyComponent)} */}
                    {badge.uri && <TableRow label={"Metadata URI"} value={<a href={badge.uri.uri} target="_blank" rel="noreferrer">{badge.uri.uri}</a>} labelSpan={9} valueSpan={15} />}
                    {badge.arbitraryBytes && <TableRow label={"Arbitrary Bytes"} value={badge.arbitraryBytes} labelSpan={9} valueSpan={15} />}
                    {<TableRow label={"Expiration"} value={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
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


                    </div>} labelSpan={9} valueSpan={15} />}
                    {metadata?.tags && <TableRow label={"Tags"} value={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {
                            metadata?.tags?.map((tag, index) => {
                                return <Tag key={index} style={{ color: SECONDARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                    {tag}
                                </Tag>
                            })
                        }
                    </div>} labelSpan={9} valueSpan={15} />}


                    {DEV_MODE &&
                        <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                            {JSON.stringify(badge, null, 2)}
                        </pre>
                    }
                </Col>
            </Row>

        </div >
    );
}
