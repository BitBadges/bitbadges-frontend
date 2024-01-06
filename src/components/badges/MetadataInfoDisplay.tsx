import {
  CheckCircleFilled,
  EditOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LockOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Divider, Tag, Tooltip } from 'antd';
import { BadgeMetadataTimeline, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, StandardsTimeline } from 'bitbadgesjs-proto';
import { Metadata, getCurrentValuesForCollection, getMetadataForBadgeId, searchUintRangesForId } from 'bitbadgesjs-utils';

import { useEffect } from 'react';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { TimelineFieldWrapper } from '../wrappers/TimelineFieldWrapper';
import { BalancesStorageRow } from './DistributionCard';

export function MetadataDisplay({ collectionId, span, badgeId, metadataOverride, isAddressListDisplay, metadataUrl }: {
  collectionId: bigint,
  badgeId?: bigint,
  span?: number;
  metadataOverride?: Metadata<bigint>,
  isAddressListDisplay?: boolean,
  metadataUrl?: string
}) {

  const collection = useCollection(collectionId)
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []) : collection?.cachedCollectionMetadata;

  const isCollectionInfo = !badgeId;
  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No Balances");
  const [_, isValid] = searchUintRangesForId(BigInt(Date.now()), metadata?.validFrom ?? []);

  useEffect(() => {
    fetchAccounts([collection?.createdBy ?? '', ...collection?.managerTimeline.map(x => x.manager) ?? [], collection?.aliasAddress ?? ''])
  }, [collection])

  if (!collection) return <></>

  return (
    <>
      {!isAddressListDisplay &&
        <InformationDisplayCard
          title={isCollectionInfo ? <>Collection Info</> : "Badge Info"}
          span={span}
        >
          {!isCollectionInfo && <TableRow label={"Badge ID"} value={`${badgeId}`} labelSpan={12} valueSpan={12} />}
          {isCollectionInfo && <TableRow label={"Collection ID"} value={collectionId === NEW_COLLECTION_ID ? 'N/A (Preview)' : `${collectionId}`} labelSpan={9} valueSpan={15} />}

          {<TableRow label={"Standards"} value={
            <TimelineFieldWrapper
              createNode={(timelineVal: StandardsTimeline<bigint>) => {
                const standards = timelineVal.standards;
                return <>
                  {standards && standards.length > 0 ? standards.map((standard) => {
                    return <Tag key={standard} className='secondary-text inherit-bg' style={{ margin: 2 }}>
                      {standard}
                    </Tag>
                  }) : 'Default'}
                </>
              }}
              timeline={collection?.standardsTimeline ?? []}
            />
          } labelSpan={9} valueSpan={15} />}
          {!noBalancesStandard && <BalancesStorageRow collection={collection} />}

          {<TableRow label={"Manager"} value={
            <>
              <TimelineFieldWrapper
                createNode={(managerVal: ManagerTimeline<bigint>) => {
                  if (!managerVal.manager) return <>None</>

                  return <AddressDisplay
                    fontSize={16}
                    addressOrUsername={managerVal.manager}
                  />
                }}
                timeline={collection?.managerTimeline ?? []}
              />
            </>} labelSpan={7} valueSpan={17} />}

          {collection?.createdBy && <TableRow label={"Created By"} value={
            <div className='flex-between' style={{ textAlign: 'right' }}>
              <div></div>
              <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
                <AddressDisplay
                  fontSize={16}
                  addressOrUsername={collection.createdBy}
                />
              </div>
            </div>} labelSpan={7} valueSpan={17} />}

          {collection?.aliasAddress && <TableRow label={
            <>{"Alias"}<Tooltip color='black' title={"This is a fake address that is reserved to represent this collection. It is not a real account and cannot initiate transactions. However, it has a portfolio and can receive badges."}>
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
            </>} value={
              <div className='flex-between' style={{ textAlign: 'right' }}>
                <div></div>
                <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
                  <AddressDisplay
                    fontSize={16}
                    addressOrUsername={collection.aliasAddress}
                  />
                </div>

              </div>} labelSpan={7} valueSpan={17} />}


          {(collection?.customDataTimeline ?? []).length > 0 &&
            collection?.customDataTimeline.some(x => x.customData) &&
            <TableRow label={"Custom Data"} value={
              <>
                <TimelineFieldWrapper
                  createNode={(customDataVal: CustomDataTimeline<bigint>) => {
                    return <>{customDataVal.customData || 'None'}</>
                  }}
                  timeline={collection?.customDataTimeline ?? []}
                />
              </>} labelSpan={9} valueSpan={15} />}



          {(collection?.isArchivedTimeline ?? []).length > 0

            && <TableRow label={"Archived"} value={
              <>

                <TimelineFieldWrapper
                  createNode={(timelineVal: IsArchivedTimeline<bigint>) => {
                    return <>{timelineVal.isArchived ? 'Yes' : 'No'}</>
                  }}
                  emptyNode={
                    <>No</>
                  }
                  timeline={collection?.isArchivedTimeline ?? []}
                />
              </>} labelSpan={9} valueSpan={15} />
          }

          <DevMode obj={collection} />
        </InformationDisplayCard>
      }
      {/* {!isAddressListDisplay && <br />} */}
      <InformationDisplayCard
        title={<>
          {badgeId && "Badge Metadata"}
          {!badgeId && !isAddressListDisplay && "Collection Metadata"}
          {isAddressListDisplay && "Metadata"}
          {
            collection && ((!badgeId && collection?.collectionMetadataTimeline.length > 1) ||
              (badgeId && collection?.badgeMetadataTimeline.length > 1)) ?
              <Tooltip color='black' title="Note this metadata is set to have different values at different times. See the Metadata URL.">
                <FieldTimeOutlined style={{ marginLeft: 4 }} />
              </Tooltip> : <> </>
          }
        </>}
        span={span}
      >
        {isAddressListDisplay && <TableRow label={"Metadata URL"} value={
          <><Tooltip placement='bottom' title={metadataUrl}>
            <a href={metadataUrl?.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${metadataUrl?.substring(7)}` : metadataUrl

            } target="_blank" rel="noreferrer">
              View
              <LinkOutlined style={{ marginLeft: 4 }} /></a>
          </Tooltip>
            {metadataUrl?.startsWith('ipfs://')
              ? <Tooltip placement='bottom' title='This metadata URL uses permanent storage, meaning this URL will always return the same metadata.'>
                <LockOutlined style={{ marginLeft: 4 }} />
              </Tooltip> :
              <Tooltip placement='bottom' title='This metadata does not use permanent storage, meaning the data is free to be changed by whoever controls the URL.'>
                <EditOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            }
          </>}
          labelSpan={9} valueSpan={15} />}

        {!badgeId && !isAddressListDisplay && <TableRow label={"Metadata URL"} value={
          <div>
            <>
              <TimelineFieldWrapper
                createNode={(timelineVal: CollectionMetadataTimeline<bigint>) => {
                  return <><Tooltip placement='bottom' title={timelineVal.collectionMetadata.uri}>
                    <a href={timelineVal.collectionMetadata.uri.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal.collectionMetadata.uri.slice(7)}` : timelineVal.collectionMetadata.uri
                    } target="_blank" rel="noreferrer">
                      View
                      <LinkOutlined style={{ marginLeft: 4 }} /></a>
                  </Tooltip>
                    {timelineVal.collectionMetadata.uri.startsWith('ipfs://')
                      ? <Tooltip placement='bottom' title='This metadata URL uses permanent storage, meaning this URL will always return the same metadata.'>
                        <LockOutlined style={{ marginLeft: 4 }} />
                      </Tooltip> :
                      <Tooltip placement='bottom' title='This metadata does not use permanent storage, meaning the data is free to be changed by whoever controls the URL.'>
                        <EditOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    }
                  </>
                }}
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

                  return <><Tooltip placement='bottom' title={uri}>
                    <a href={(uri.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${uri.slice(7)}` : uri).replace("{id}", badgeId.toString())
                    } target="_blank" rel="noreferrer">
                      View
                      <LinkOutlined style={{ marginLeft: 4 }} /></a>
                  </Tooltip>
                    {uri.startsWith('ipfs://')
                      ? <Tooltip placement='bottom' title='This metadata URL uses permanent storage, meaning this URL will always return the same metadata.'>
                        <LockOutlined style={{ marginLeft: 4 }} />
                      </Tooltip> :
                      <Tooltip placement='bottom' title='This metadata does not use permanent storage, meaning the data is free to be changed by whoever controls the URL.'>
                        <EditOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    }
                  </>
                }}
                timeline={collection?.badgeMetadataTimeline ?? []}
              />
            </>
          </div>
        } labelSpan={9} valueSpan={15} />}

        {metadata?.name && <TableRow label={"Name"} value={metadata.name} labelSpan={9} valueSpan={15} />}
        {metadata?.category && <TableRow label={"Category"} value={metadata.category} labelSpan={9} valueSpan={15} />}
        {metadata?.externalUrl && <TableRow label={"Website"} value={
          <div>
            <Tooltip placement='bottom' title={`${metadata.externalUrl}`}>
              <a href={`${metadata.externalUrl.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${metadata.externalUrl.slice(7)}` : metadata.externalUrl}`} target="_blank" rel="noreferrer">
                View
                <LinkOutlined style={{ marginLeft: 4 }} /></a>
            </Tooltip>
          </div>
        } labelSpan={9} valueSpan={15} />}

        {/* {isCollectionInfo && collection?.bytes && <TableRow label={"Bytes"} value={collection.bytes} labelSpan={9} valueSpan={15} />} */}
        {metadata?.validFrom && metadata?.validFrom.length > 0 && <TableRow label={"Validity"} value={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
            {getTimeRangesElement(metadata.validFrom, 'Valid from ', true)}
            <Divider type="vertical" />
            {isValid ? (
              <CheckCircleFilled
                style={{
                  fontSize: 20,
                  color: 'green',
                }}
              />
            ) : (
              <WarningFilled
                style={{
                  fontSize: 20,
                  color: 'red',
                }}
              />
            )}
          </div>} labelSpan={9} valueSpan={15} />
        }

        {metadata?.tags && <TableRow label={"Tags"} value={<div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
          {
            metadata?.tags?.map((tag, index) => {
              return <Tag key={index} className='secondary-text inherit-bg' style={{ margin: 2 }}>
                {tag}
              </Tag>
            })
          }
        </div>} labelSpan={9} valueSpan={15} />}

        {!!metadata?.fetchedAt && <TableRow label={"Last Updated"} value={<>{new Date(Number(metadata.fetchedAt)).toLocaleString()}</>} labelSpan={9} valueSpan={15} />}
      </InformationDisplayCard>
    </>
  );
}
