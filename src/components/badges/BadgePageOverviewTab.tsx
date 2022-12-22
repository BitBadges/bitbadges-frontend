import { Address } from '../Address';
import { Avatar, Tooltip, Divider, Alert, Typography, Col, Row, Table } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faUserLock } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import {
    SwapOutlined,
    CheckCircleFilled,
    WarningFilled,
    LockFilled,
    UnlockFilled,
    RollbackOutlined,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { BitBadge, BitBadgeCollection } from '../../bitbadges-api/types';
import { ColumnsType } from 'antd/lib/table';
import { Permissions } from '../../bitbadges-api/permissions';

const { Text } = Typography;


export function BadgeOverviewTab({ badge, hidePermissions }: {
    badge: BitBadgeCollection | undefined;
    hidePermissions?: boolean;
}) {
    if (!badge) return <></>

    console.log("Loading BadgeHeader for The Following Badge: ", badge);



    let endTimestamp = MAX_DATE_TIMESTAMP;
    let validForever = true;
    if (badge.metadata?.validFrom?.end) {
        endTimestamp = badge.metadata.validFrom.end;
        validForever = false;
    }

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp
    ).toLocaleDateString();

    // let subassetSupplyComponent = <>
    //     {
    //         badge.subassetSupplys.map((subassetSupply) => {
    //             return <div key={subassetSupply.balance}>
    //                 <Text style={{ fontSize: 18, color: PRIMARY_TEXT }}>
    //                     Supply = {subassetSupply.balance} for IDs {subassetSupply.idRanges.map((idRange) => {
    //                         return <>{idRange.start}-{idRange.end}</>
    //                     })}
    //                 </Text>
    //                 <br />
    //             </div>
    //         })
    //     }
    // </>

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
            <Divider></Divider>
            <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Col span={11}>
                    <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                            Badge Information
                        </Text>
                    </Row>
                    <Divider style={{ margin: "4px 0px", color: 'white', background: 'white' }}></Divider>
                    {getTableRow("Collection Number", badge.id)}
                    {getTableRow("Standard", badge.standard == 0 ? "BitBadge" : "Unknown")}
                    {badge.manager && getTableRow("Manager", <Address
                        chainToDisplay='eth'

                        address={badge.manager.split(':')[1]}
                        fontColor="lightgrey"
                        fontSize={18}
                        showTooltip
                    />)}
                    {badge.metadata?.description && getTableRow("Description", badge.metadata.description)}
                    {/* {getTableRow("Sub-Badges", subassetSupplyComponent)} */}
                    {badge.uri && getTableRow("URI", <a href={badge.uri.uri} target="_blank" rel="noreferrer">{badge.uri.uri}</a>)}
                    {badge.arbitraryBytes && getTableRow("Arbitrary Bytes", badge.arbitraryBytes)}
                    {getTableRow("Expiration",
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {`Valid ${badge.metadata?.validFrom?.end && badge.metadata?.validFrom?.end !== MAX_DATE_TIMESTAMP
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
                <Col span={11}>
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
            </Row>

        </div >
    );
}
