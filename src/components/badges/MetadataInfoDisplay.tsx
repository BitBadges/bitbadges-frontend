import {
    CheckCircleFilled,
    LinkOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Divider, Tag, Tooltip } from 'antd';
import { getMetadataMapObjForBadgeId, getSupplyByBadgeId } from 'bitbadgesjs-utils';
import { BadgeMetadata, BitBadgeCollection, MAX_DATE_TIMESTAMP } from 'bitbadgesjs-utils';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';

export function MetadataDisplay({ collection, metadata, span, isCollectionInfo, badgeId, showCollectionLink }: {
    collection: BitBadgeCollection | undefined;
    metadata: BadgeMetadata | undefined;
    span?: number;
    isCollectionInfo?: boolean
    badgeId?: number
    showCollectionLink?: boolean
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


    const badgeUri = getMetadataMapObjForBadgeId(badgeId ? badgeId : -1, collection.badgeMetadata)?.uri;

    let totalSupply, undistributedSupply, distributedSupply, claimableSupply = 0;
    if (badgeId) {
        //Calculate total, undistributed, claimable, and distributed supplys
        totalSupply = getSupplyByBadgeId(badgeId, collection.maxSupplys);
        undistributedSupply = getSupplyByBadgeId(badgeId, collection.unmintedSupplys);

        for (const claim of collection.claims) {
            claimableSupply += getSupplyByBadgeId(badgeId, claim.balances);
        }
        distributedSupply = totalSupply - undistributedSupply - claimableSupply;
    }

    return (
        <InformationDisplayCard
            title={isCollectionInfo ? <>Collection Info

                <br />
                <div style={{ fontSize: 14 }}>
                    {showCollectionLink && <a style={{ marginLeft: 8 }} href={`/collections/${collection.collectionId}`} target="_blank" rel="noreferrer">View Collection <LinkOutlined /></a>}
                </div></> : "Badge Info"}
            span={span}
        >
            {!isCollectionInfo && <TableRow label={"Badge ID"} value={badgeId} labelSpan={12} valueSpan={12} />}

            {isCollectionInfo && <TableRow label={"Collection ID"} value={collection.collectionId === 0 ? 'N/A (Preview)' : collection.collectionId} labelSpan={9} valueSpan={15} />}
            {<TableRow label={"Type"} value={collection.standard == 0 ? "BitBadge" : "Unknown"} labelSpan={9} valueSpan={15} />}
            {collection.manager && <TableRow label={"Manager"} value={<div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'row' }}>
                <div></div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', textAlign: 'right', flexDirection: 'column', padding: 0
                }}>
                    <AddressDisplay
                        fontSize={14}
                        fontColor={SECONDARY_TEXT}
                        userInfo={collection?.manager}
                        hideChains
                    />
                </div>
            </div>} labelSpan={9} valueSpan={15} />}
            {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
            {!isCollectionInfo && <TableRow label={"Supply"} value={
                <div>
                    <div>Total: {totalSupply}</div>
                    <div>Unminted: {undistributedSupply} / {totalSupply}</div>
                    <div>Claimable: {claimableSupply} / {totalSupply}</div>
                    <div>Minted: {distributedSupply} / {totalSupply}</div>
                </div>
            } labelSpan={12} valueSpan={12} />}
            {isCollectionInfo && collection.collectionUri && <TableRow label={"Metadata URL"} value={
                <div>
                    <Tooltip placement='bottom' title={collection.collectionUri}>
                        <a href={collection.collectionUri} target="_blank" rel="noreferrer">{collection.collectionUri.length > 20 ? collection.collectionUri.slice(0, 10) + '...' + collection.collectionUri.slice(collection.collectionUri.length - 13) : collection.collectionUri} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />}
            {!isCollectionInfo && badgeId && badgeUri && <TableRow label={"Metadata URL"} value={
                <div>
                    <Tooltip placement='bottom' title={`${badgeUri}`}>
                        <a href={`${badgeUri}`} target="_blank" rel="noreferrer">{badgeUri.length > 20 ? badgeUri.slice(0, 10) + '...' + badgeUri.slice(badgeUri.length - 13) : badgeUri} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />}

            {metadata.externalUrl && <TableRow label={"Website"} value={
                <div>
                    <Tooltip placement='bottom' title={`${metadata.externalUrl}`}>
                        <a href={`${metadata.externalUrl}`} target="_blank" rel="noreferrer">{metadata.externalUrl.length > 20 ? metadata.externalUrl.slice(0, 10) + '...' + metadata.externalUrl.slice(metadata.externalUrl.length - 10) : metadata.externalUrl} <LinkOutlined /></a>
                    </Tooltip>
                </div>
            } labelSpan={9} valueSpan={15} />}
            {/* {metadata?.description && <TableRow label={"Description"} value={metadata.description} labelSpan={12} valueSpan={12} />} */}



            {isCollectionInfo && collection.bytes && <TableRow label={"Arbitrary Bytes"} value={collection.bytes} labelSpan={9} valueSpan={15} />}
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

            {metadata?.tags && <TableRow label={"Tags"} value={<div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
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
