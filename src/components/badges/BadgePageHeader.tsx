import { Avatar, Col, Row, Typography } from 'antd';
import React, { useEffect } from 'react';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeMetadata } from '../../bitbadges-api/types';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';


const { Text } = Typography;

export function BadgePageHeader({ metadata }: {
    metadata?: BadgeMetadata;
}) {
    useEffect(() => {
        const description = document.getElementById('description');
        if (description) {
            description.innerHTML = sanitizeHtml(marked(metadata?.description || ''));
        }
    }, [metadata]);

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

                    {metadata?.description && <div style={{ maxWidth: 500, marginLeft: 20 }}>

                        <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                            {metadata?.name}
                        </Text>
                        <br />
                        <div id="description" style={{ padding: 20, color: PRIMARY_TEXT }} >
                            {/* {metadata?.description} */}
                        </div>
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
