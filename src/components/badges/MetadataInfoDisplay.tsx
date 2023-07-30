import {
  CheckCircleFilled,
  InfoCircleOutlined,
  LinkOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Divider, Tag, Tooltip } from 'antd';
import { BadgeMetadataTimeline, CollectionMetadataTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline } from 'bitbadgesjs-proto';
import { getBalanceForIdAndTime, getMetadataForBadgeId, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getTimeRangesString } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { TimelineFieldWrapper } from '../wrappers/TimelineFieldWrapper';


//TODO: Actually support fetching the time-based metadata as well but that requires an overhaul of .badgeMetadata and .collectionMetadata

export function MetadataDisplay({ collectionId, span, badgeId, showCollectionLink }: {
  collectionId: bigint,
  badgeId?: bigint,
  span?: number;
  showCollectionLink?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const metadata = badgeId ? getMetadataForBadgeId(badgeId, collection?.badgeMetadata ?? []) : collection?.collectionMetadata;

  const isCollectionInfo = !badgeId;
  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  let totalSupply, undistributedSupply, distributedSupply = 0n;
  if (collection && badgeId) {
    //Calculate total, undistributed, claimable, and distributed supplys
    const totalSupplyBalance = collection.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
    const mintSupplyBalance = collection.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];

    totalSupply = getBalanceForIdAndTime(badgeId, BigInt(Date.now()), totalSupplyBalance);
    undistributedSupply = getBalanceForIdAndTime(badgeId, BigInt(Date.now()), mintSupplyBalance);
    distributedSupply = totalSupply - undistributedSupply;
  }

  const [_, isValid] = searchUintRangesForId(BigInt(Date.now()), metadata?.validFrom ?? []);
  let balancesTypeInfoStr = '';
  if (collection?.balancesType === "Off-Chain") {
    balancesTypeInfoStr = 'Balances are stored off the blockchain and controlled via a typical server (chosen by the manager). Transferring and obtaining badges is not done via the blockchain but rather via this server.';
  } else if (collection?.balancesType === "Standard") {
    balancesTypeInfoStr = 'Transferring and obtaining badges is all facilitated via blockchain transactions.';
  } else if (collection?.balancesType === "Inherited") {
    balancesTypeInfoStr = 'Balances of a badge are inherited from some parent badge. When you obtain or transfer the parent badge, the child badge will also be obtained or transferred.';
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

      {<TableRow label={"Standards"} value={
        <TimelineFieldWrapper
          createNode={(timelineVal: StandardsTimeline<bigint>) => {
            const standards = timelineVal.standards;
            return <>
              {standards && standards.length > 0 ? standards.map((standard) => {
                return <Tag key={standard} className='secondary-text primary-blue-bg' style={{ margin: 2 }}>
                  {standard}
                </Tag>
              }) : 'Default'}
            </>
          }}
          emptyNode={
            <>Default</>
          }
          timeline={collection?.standardsTimeline ?? []}
        />
      } labelSpan={9} valueSpan={15} />}
      {<TableRow label={"Balances Type"} value={
        <>
          {collection?.balancesType === "Off-Chain" ?
            <div>
              <>
                <TimelineFieldWrapper
                  createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                    return <a href={timelineVal?.offChainBalancesMetadata.uri} target='_blank' rel='noreferrer'>Off-Chain</a>
                  }}
                  emptyNode={
                    <>None</>
                  }
                  timeline={collection?.offChainBalancesMetadataTimeline ?? []}
                />
              </>
            </div>
            : collection?.balancesType}
          <Tooltip color='black' title={balancesTypeInfoStr}>
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </>} labelSpan={9} valueSpan={15} />
      }

      {<TableRow label={"Manager"} value={
        <>
          <TimelineFieldWrapper
            createNode={(managerVal: ManagerTimeline<bigint>) => {
              return <AddressDisplay
                fontSize={13}
                addressOrUsername={managerVal.manager}
              />
            }}
            emptyNode={
              <AddressDisplay
                fontSize={13}
                addressOrUsername={""}
              />
            }
            timeline={collection?.managerTimeline ?? []}
          />
        </>} labelSpan={9} valueSpan={15} />}

      {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
      {collection?.createdBy && <TableRow label={"Created By"} value={
        <div className='flex-between' style={{ textAlign: 'right' }}>
          <div></div>
          <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
            <AddressDisplay
              fontSize={13}
              addressOrUsername={collection.createdBy}
            />
          </div>
        </div>} labelSpan={9} valueSpan={15} />}

      {!isCollectionInfo && !isOffChainBalances && <TableRow label={"Supply"} value={
        <div>
          <div>Total: {totalSupply?.toString()}</div>
          {!isOffChainBalances && <>
            {/* <div>Unminted: {undistributedSupply?.toString()} / {totalSupply?.toString()}</div> */}
            <div>Minted: {distributedSupply?.toString()} / {totalSupply?.toString()}</div>
          </>}
        </div>
      } labelSpan={12} valueSpan={12} />}
      {!badgeId && <TableRow label={"Metadata URL"} value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: CollectionMetadataTimeline<bigint>) => {
                return <Tooltip placement='bottom' title={timelineVal.collectionMetadata.uri}>
                  <a href={timelineVal.collectionMetadata.uri} target="_blank" rel="noreferrer">
                    View
                    <LinkOutlined style={{ marginLeft: 4 }} /></a>
                </Tooltip>
              }}
              emptyNode={
                <>None</>
              }
              timeline={collection?.collectionMetadataTimeline ?? []}
            />
          </>
        </div>
      } labelSpan={9} valueSpan={15} />}

      {!!badgeId && badgeId > 0n && <TableRow label={"Metadata URL"} value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: BadgeMetadataTimeline<bigint>) => {
                let uri = '';
                for (const badgeMetadata of timelineVal.badgeMetadata) {
                  const [_, found] = searchUintRangesForId(badgeId, badgeMetadata.badgeIds);
                  if (found && !uri) {
                    uri = badgeMetadata.uri;
                  }
                }

                return <Tooltip placement='bottom' title={uri}>
                  <a href={uri} target="_blank" rel="noreferrer">
                    View
                    <LinkOutlined style={{ marginLeft: 4 }} /></a>
                </Tooltip>
              }}
              emptyNode={
                <>None</>
              }
              timeline={collection?.badgeMetadataTimeline ?? []}
            />
          </>
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

      {/* {isCollectionInfo && collection?.bytes && <TableRow label={"Bytes"} value={collection.bytes} labelSpan={9} valueSpan={15} />} */}
      {metadata?.validFrom && <TableRow label={"Validity"} value={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
          {getTimeRangesString(metadata.validFrom)}
          <Divider type="vertical" />
          {isValid ? (
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
