import { Avatar, Col, Divider, Row, Typography } from 'antd';
import React from 'react';
import { PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BadgeMetadata } from '../../bitbadges-api/types';

const { Text } = Typography;

export function BadgePageHeader({ metadata }: {
    metadata?: BadgeMetadata;
}) {
    if (!metadata) return <></>;

    return (<>
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <Row
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Col span={24}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                        }}
                    >
                        <Avatar
                            style={{
                                verticalAlign: 'middle',
                                border: '3px solid',
                                borderColor: metadata?.color
                                    ? metadata?.color
                                    : 'black',
                                margin: 4,
                                backgroundColor: metadata?.image
                                    ? PRIMARY_TEXT
                                    : metadata?.color,
                            }}
                            // className="badge-avatar"   //For scaling on hover
                            src={
                                metadata?.image ? metadata?.image : undefined
                            }
                            size={200}
                            onError={() => {
                                return false;
                            }}
                        />

                    </div>
                    <Divider type="vertical" style={{ height: '100%' }} />
                    {metadata?.description && <div style={{ maxWidth: 500 }}>
                        <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                            {metadata?.name}
                        </Text>
                        <br />
                        <Text style={{ color: SECONDARY_TEXT }}>
                            {metadata?.description}
                        </Text>
                    </div>}
                </Col>
            </Row>
            {!metadata?.description && <div>
                <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                    {metadata?.name}
                </Text>
            </div>}
            <br />
        </div>
    </>
    );
}
