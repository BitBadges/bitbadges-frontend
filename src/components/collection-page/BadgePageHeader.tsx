import { Avatar, Col, Divider, Row, Spin, Typography } from 'antd';
import MarkdownIt from 'markdown-it';
import { useEffect, useState } from 'react';
import { BadgeMetadata } from '../../bitbadges-api/types';
import { PRIMARY_TEXT } from '../../constants';
import Markdown from "react-markdown"

const { Text } = Typography;

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);


export function BadgePageHeader({ metadata }: {
    metadata?: BadgeMetadata;
}) {
    const [innerHtml, setInnerHtml] = useState<string>('');

    useEffect(() => {
        setInnerHtml(mdParser.render(metadata?.description || ''));
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
                                metadata?.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : <Spin />
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
            </Row>
            <Divider />

            <br />
        </div>
    </>
    );
}
