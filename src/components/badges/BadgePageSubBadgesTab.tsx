import { Address } from '../Address';
import { Avatar, Tooltip, Divider, Alert, Typography, Col, Row, Table } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faUserLock } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
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
import { Badge } from './Badge';
import { getFromIpfs } from '../../chain/backend_connectors';

const { Text } = Typography;

const getSupplyByBadgeId = (badgeCollection: BitBadgeCollection, badgeId: number) => {
    let supply = badgeCollection.subassetSupplys.find((subassetSupply) => {

        return subassetSupply.idRanges.find((idRange) => {
            if (idRange.start === undefined || idRange.end === undefined) {
                return false;
            }
            return badgeId >= idRange.start && badgeId <= idRange.end;
        });
    });

    console.log("supply", supply)

    return supply?.balance ?? 0;
}


export function BadgeSubBadgesTab({ badgeCollection }: {
    badgeCollection: BitBadgeCollection | undefined;
}) {
    const [badgeDisplay, setBadgeDisplay] = useState<BitBadge[]>([]);

    useEffect(() => {
        if (!badgeCollection) return;
        async function updateDisplay(badgeCollection: BitBadgeCollection) {
            //TODO: fetch metadata here (should probably make it more scalable than this)
            //TODO: also make this display scroll based / limited (25 at a time)
            //TODO: change this to get actual bagde metadata and uri
            //TODO: pass in and maintain in parent component

            let display = [];
            for (let i = 0; i < badgeCollection.nextSubassetId; i++) {
                const res = await getFromIpfs(badgeCollection.uri.uri, `${i}`);
                const metadata = JSON.parse(res.file);

                display.push({
                    metadata: metadata,
                    badgeId: i,
                    uri: badgeCollection.uri,
                    totalSupply: getSupplyByBadgeId(badgeCollection, i),
                });
            }
            setBadgeDisplay(display);
        }
        updateDisplay(badgeCollection);
    }, [badgeCollection])

    if (!badgeCollection) return <></>

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {badgeDisplay.map((badge) => {
                    return <div key={badge.badgeId}>
                        <Badge collection={badgeCollection} badge={badge} />
                    </div>
                })}
            </div>


            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badgeCollection, null, 2)}
                </pre>
            }
        </div >
    );
}
