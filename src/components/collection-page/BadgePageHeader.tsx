import { Avatar, Col, Divider, Row, Typography } from 'antd';
import { useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import { BadgeMetadata } from '../../bitbadges-api/types';
import { PRIMARY_TEXT } from '../../constants';
import MarkdownIt from 'markdown-it';

const { Text } = Typography;

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);


export function BadgePageHeader({ metadata }: {
    metadata?: BadgeMetadata;
}) {
    useEffect(() => {
        const description = document.getElementById('description');
        if (description) {
            description.innerHTML = mdParser.render(metadata?.description || '');
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
                <Col span={8}
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
                            }}
                            src={
                                metadata?.image ? metadata?.image : undefined
                            }
                            size={200}
                            onError={() => {
                                return false;
                            }}
                        />

                        {<div style={{ maxWidth: 500 }}>

                            <Text strong style={{ fontSize: 30, color: PRIMARY_TEXT }}>
                                {metadata?.name}
                            </Text>

                        </div>}
                    </div>
                </Col>
                {metadata?.description &&
                    <Col span={16}
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
                            {<div>
                                <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >
                                    {/* {metadata?.description} */}
                                </div>
                            </div>}
                        </div>
                    </Col>
                }
            </Row>
            <Divider />

            <br />
        </div>
    </>
    );
}
