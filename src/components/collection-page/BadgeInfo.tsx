import {
    CheckCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { Col, Divider, Row, Typography } from 'antd';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';
import { DEV_MODE, GO_MAX_UINT_64, PRIMARY_TEXT } from '../../constants';
import { TableRow } from '../display/TableRow';

const { Text } = Typography;

export function BadgeOverview({ collection, metadata, badgeId }: {
    collection: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    badgeId: number
}) {
    if (!collection || !metadata) return <></>

    let endTimestamp = GO_MAX_UINT_64;
    let validForever = false;
    if (metadata?.validFrom?.end === GO_MAX_UINT_64) {
        endTimestamp = metadata.validFrom.end;
        validForever = true;
    }

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp * 1000
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
                            Badge Info
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                    {<TableRow label={"Badge ID"} value={badgeId} labelSpan={12} valueSpan={12} />}

                    {metadata?.description && <TableRow label={"Description"} value={metadata.description} labelSpan={12} valueSpan={12} />}
                    {<TableRow label={"Expiration"} value={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
                        {`Valid ${metadata?.validFrom?.end && metadata?.validFrom?.end !== GO_MAX_UINT_64
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


                    </div>} labelSpan={12} valueSpan={12} />}


                    {DEV_MODE &&
                        <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    }
                </Col>
            </Row>
        </div >
    );
}
