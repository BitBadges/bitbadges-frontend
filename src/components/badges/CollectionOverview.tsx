import { Divider, Tag, Tooltip } from 'antd';
import React from 'react';
import {
    CheckCircleFilled,
    LinkOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';
import { AddressDisplay } from '../address/AddressDisplay';
import { useChainContext } from '../../chain/ChainContext';
import { TableRow } from '../common/TableRow';
import { InformationDisplayCard } from '../common/InformationDisplayCard';
import { getUriFromUriObject } from '../../bitbadges-api/uris';
import { getAbbreviatedAddress } from '../../bitbadges-api/utils/AddressUtils';

export function CollectionOverview({ badge, metadata, span }: {
    badge: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    span?: number;
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
        endTimestamp * 1000
    ).toLocaleDateString();


    return (
        <InformationDisplayCard
            title="Collection Info"
            span={span}
        >
            <TableRow label={"Collection ID"} value={badge.id} labelSpan={9} valueSpan={15} />
            <TableRow label={"Type"} value={badge.standard == 0 ? "BitBadge" : "Unknown"} labelSpan={9} valueSpan={15} />
            {badge.manager && <TableRow label={"Manager"} value={<div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'row' }}>
                <div></div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'column'
                }} >
                    <AddressDisplay
                        fontSize={14}
                        fontColor={SECONDARY_TEXT}
                        userInfo={badge?.manager}
                        // userInfo={{
                        //     address: chain.address,
                        //     chain: chain.chain,
                        //     accountNumber: chain.accountNumber,
                        //     cosmosAddress: chain.cosmosAddress,
                        // }}
                        hideChains
                    />
                </div>

            </div>} labelSpan={9} valueSpan={15} />}
            {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
            {/* {<TableRow label={} value={} labelSpan={9} valueSpan={15} />"Sub-Badges", subassetSupplyComponent)} */}
            {badge.uri && <TableRow label={"Metadata URI"} value={
                <div>
                    <Tooltip title={getUriFromUriObject(badge.uri)}>
                        <a href={getUriFromUriObject(badge.uri)} target="_blank" rel="noreferrer">{getUriFromUriObject(badge.uri).slice(0, 10) + '...' + getUriFromUriObject(badge.uri).slice(getUriFromUriObject(badge.uri).length - 13)} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />}
            {badge.arbitraryBytes && <TableRow label={"Arbitrary Bytes"} value={badge.arbitraryBytes} labelSpan={9} valueSpan={15} />}
            <TableRow label={"Expiration"} value={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
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
            </div>} labelSpan={9} valueSpan={15} />

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
                <pre style={{ maxHeight: 500, marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badge, null, 2)}
                </pre>
            }
        </InformationDisplayCard>
    );
}
