import {
  CheckCircleFilled,
  LinkOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { Divider, Tag, Tooltip } from 'antd';
import { getBalanceForId, getMetadataDetailsForBadgeId, getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { getTimeRangeString } from '../../utils/dates';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';

export function MetadataDisplay({ collectionId, span, badgeId, showCollectionLink }: {
  collectionId: bigint,
  badgeId?: bigint,
  span?: number;
  showCollectionLink?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const metadata = badgeId ? getMetadataForBadgeId(badgeId, collection?.badgeMetadata ?? []) : collection?.collectionMetadata;
  const uri = badgeId ? getMetadataDetailsForBadgeId(badgeId, collection?.badgeMetadata ?? [])?.uri : collection?.collectionUri;
  const isCollectionInfo = !badgeId;
  const isOffChainBalances = collection && collection.balancesUri ? true : false;


  let totalSupply, undistributedSupply, distributedSupply = 0n;
  if (collection && badgeId) {
    //Calculate total, undistributed, claimable, and distributed supplys
    totalSupply = getBalanceForId(badgeId, collection.maxSupplys);
    undistributedSupply = getBalanceForId(badgeId, collection.unmintedSupplys);
    distributedSupply = totalSupply - undistributedSupply;
  }

  return (
    <InformationDisplayCard
      title={isCollectionInfo ? <>Collection Info
        <br />
        <div style={{ fontSize: 14 }}>
          {showCollectionLink && <a style={{ marginLeft: 8 }} href={`/collections/${collectionId}`} target="_blank" rel="noreferrer">View Collection <LinkOutlined /></a>}
        </div>
      </> : "Badge Info"}
      span={span}
    >
      {!isCollectionInfo && <TableRow label={"Badge ID"} value={`${badgeId}`} labelSpan={12} valueSpan={12} />}
      {isCollectionInfo && <TableRow label={"Collection ID"} value={collectionId === MSG_PREVIEW_ID ? 'N/A (Preview)' : `${collectionId}`} labelSpan={9} valueSpan={15} />}

      {<TableRow label={"Standard"} value={collection?.standard === 0n ? "BitBadge" : `${collection?.standard}`} labelSpan={9} valueSpan={15} />}
      {<TableRow label={"Balances"} value={collection?.balancesUri ? <a href={collection.balancesUri} target='_blank' rel='noreferrer'>Off-Chain</a> : 'On-Chain'} labelSpan={9} valueSpan={15} />}

      {collection?.manager && <TableRow label={"Manager"} value={
        <div className='flex-between' style={{ textAlign: 'right' }}>
          <div></div>
          <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
            <AddressDisplay
              fontSize={12}
              addressOrUsername={collection?.manager}
            />
          </div>
        </div>} labelSpan={9} valueSpan={15} />}

      {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
      {!isCollectionInfo && !isOffChainBalances && <TableRow label={"Supply"} value={
        <div>
          <div>Total: {totalSupply?.toString()}</div>
          {!isOffChainBalances && <>
            <div>Unminted: {undistributedSupply?.toString()} / {totalSupply?.toString()}</div>
            <div>Minted + Claimable: {distributedSupply?.toString()} / {totalSupply?.toString()}</div>
          </>}
        </div>
      } labelSpan={12} valueSpan={12} />}
      {uri && <TableRow label={"Metadata URL"} value={
        <div>
          <Tooltip placement='bottom' title={uri}>
            <a href={uri} target="_blank" rel="noreferrer">
              View
              <LinkOutlined style={{ marginLeft: 4 }} /></a>
          </Tooltip>
        </div>
      } labelSpan={9} valueSpan={15} />}

      {metadata?.externalUrl && <TableRow label={"Website"} value={
        <div>
          <Tooltip placement='bottom' title={`${metadata.externalUrl}`}>
            <a href={`${metadata.externalUrl}`} target="_blank" rel="noreferrer">
              View
              <LinkOutlined style={{ marginLeft: 4 }} /></a>
          </Tooltip>
        </div>
      } labelSpan={9} valueSpan={15} />}

      {isCollectionInfo && collection?.bytes && <TableRow label={"Bytes"} value={collection.bytes} labelSpan={9} valueSpan={15} />}
      {metadata?.validFrom && <TableRow label={"Validity"} value={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
          {getTimeRangeString(metadata.validFrom)}
          <Divider type="vertical" />
          {Date.now() <= metadata.validFrom.end ? (
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
      }

      {metadata?.tags && <TableRow label={"Tags"} value={<div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
        {
          metadata?.tags?.map((tag, index) => {
            return <Tag key={index} className='secondary-text primary-blue-bg' style={{ margin: 2 }}>
              {tag}
            </Tag>
          })
        }
      </div>} labelSpan={9} valueSpan={15} />}

      <DevMode obj={collection} />
    </InformationDisplayCard>
  );
}
