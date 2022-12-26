import { Address } from '../../Address';
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
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata, BitBadge, BitBadgeCollection } from '../../../bitbadges-api/types';
import { ColumnsType } from 'antd/lib/table';
import { Permissions } from '../../../bitbadges-api/permissions';
import { BadgeCard } from '../../BadgeCard';
import { getFromIpfs } from '../../../chain/backend_connectors';
import { UriObject } from 'bitbadgesjs-transactions/dist/messages/bitbadges/badges/typeUtils';

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


export function BadgeSubBadgesTab({ badgeCollection, individualBadgeMetadata, hack }: {
    badgeCollection: BitBadgeCollection | undefined;
    individualBadgeMetadata?: BadgeMetadata[];
    hack?: boolean;
}) {
    const [badgeDisplay, setBadgeDisplay] = useState<BitBadge[]>([]);

    let stringified = JSON.stringify(individualBadgeMetadata);

    useEffect(() => {
        console.log("UPDATING")
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            //TODO: fetch metadata here (should probably make it more scalable than this)
            //TODO: also make this display scroll based / limited (25 at a time)
            //TODO: change this to get actual bagde metadata and uri
            //TODO: pass in and maintain in parent component

            let numBadges = badgeCollection?.nextSubassetId ? badgeCollection?.nextSubassetId : 0;
            if (individualBadgeMetadata) {
                numBadges = individualBadgeMetadata?.length ?? 0;
            }

            let uri = '';
            if (badgeCollection?.uri) {
                uri = badgeCollection?.uri.uri;
            }
            console.log("numBadges", numBadges)

            let display = [];
            for (let i = 0; i < numBadges; i++) {
                let metadata;
                if (!individualBadgeMetadata) {
                    const res = await getFromIpfs(uri, `${i}`);
                    metadata = JSON.parse(res.file);
                } else {
                    metadata = individualBadgeMetadata[i];
                }

                display.push({
                    metadata: metadata,
                    badgeId: i,
                    uri: {} as UriObject,
                    totalSupply: badgeCollection ? getSupplyByBadgeId(badgeCollection, i) : 0,
                });
            }
            setBadgeDisplay(display);
        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata]);

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            {hack && <></>}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {badgeDisplay.map((badge) => {
                    console.log(badge);
                    return <div key={badge.badgeId}>
                        <BadgeCard collection={badgeCollection} badge={badge} />
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
