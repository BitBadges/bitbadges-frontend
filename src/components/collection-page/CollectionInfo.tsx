import {
    CheckCircleFilled,
    LinkOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Divider, Tag, Tooltip } from 'antd';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';
import { DEV_MODE, MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';

export function CollectionOverview({ collection, metadata, span }: {
    collection: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    span?: number;
}) {
    if (!collection || !metadata) return <></>

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
            <TableRow label={"Collection ID"} value={collection.collectionId} labelSpan={9} valueSpan={15} />
            <TableRow label={"Type"} value={collection.standard == 0 ? "BitBadge" : "Unknown"} labelSpan={9} valueSpan={15} />
            {collection.manager && <TableRow label={"Manager"} value={<div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'row' }}>
                <div></div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'column'
                }} >
                    <AddressDisplay
                        fontSize={14}
                        fontColor={SECONDARY_TEXT}
                        userInfo={collection?.manager}
                        hideChains
                    />
                </div>

            </div>} labelSpan={9} valueSpan={15} />}
            {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
            {collection.collectionUri && <TableRow label={"Collection Metadata"} value={
                <div>
                    <Tooltip placement='bottom' title={collection.collectionUri}>
                        <a href={collection.collectionUri} target="_blank" rel="noreferrer">{collection.collectionUri.slice(0, 10) + '...' + collection.collectionUri.slice(collection.collectionUri.length - 13)} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />}
            {/* {collection.badgeUris && <TableRow label={"Badge Metadata"} value={
                <div>
                    <Tooltip placement='bottom' title={<>
                        {collection.badgeUri}
                        <br />
                        <br />
                        {"Replace {id} with the badge ID to get the badge metadata."}
                    </>}>
                        <a href={collection.badgeUri} target="_blank" rel="noreferrer">{collection.badgeUri.slice(0, 10) + '...' + collection.badgeUri.slice(collection.badgeUri.length - 13)} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />} */}
            {collection.bytes && <TableRow label={"Arbitrary Bytes"} value={collection.bytes} labelSpan={9} valueSpan={15} />}
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
                    {JSON.stringify(collection, null, 2)}
                </pre>
            }
        </InformationDisplayCard>
    );
}
