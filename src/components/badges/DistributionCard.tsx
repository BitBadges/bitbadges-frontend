import { EditOutlined, InfoCircleOutlined, LinkOutlined, LockOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { BalanceArray, OffChainBalancesMetadataTimeline, UintRangeArray, getBalancesForId } from 'bitbadgesjs-sdk';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../bitbadges-api/utils/manager';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { PermissionIcon } from '../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { TimelineFieldWrapper } from '../wrappers/TimelineFieldWrapper';

export function BalancesStorageRow({ collectionId }: { collectionId?: bigint }) {
  const collection = useCollection(collectionId);
  return (
    <TableRow
      label={'Balances Storage'}
      value={
        <>
          <div
            className=""
            style={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'end'
            }}>
            {collection?.balancesType === 'Off-Chain - Indexed' ? (
              <div>
                <>
                  <TimelineFieldWrapper
                    createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                      return (
                        <a
                          href={
                            timelineVal?.offChainBalancesMetadata.uri.startsWith('ipfs://')
                              ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal?.offChainBalancesMetadata.uri.substring(7)}`
                              : timelineVal?.offChainBalancesMetadata.uri
                          }
                          target="_blank"
                          rel="noreferrer">
                          Off-Chain
                        </a>
                      );
                    }}
                    emptyNode={<>None</>}
                    timeline={collection?.offChainBalancesMetadataTimeline ?? []}
                  />
                </>
              </div>
            ) : (
              collection?.balancesType
            )}
          </div>
        </>
      }
      labelSpan={9}
      valueSpan={15}
    />
  );
}

export function DefaultBalancesRow({ collectionId }: { collectionId?: bigint }) {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  return (
    <TableRow
      label={'Default Balances'}
      value={
        <>
          <div
            className=""
            style={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'end'
            }}>
            {collection?.defaultBalances.balances.length > 0 ? (
              <BalanceDisplay
                hideBadges
                floatToRight
                collectionId={collection.collectionId}
                hideMessage
                balances={collection?.defaultBalances.balances}
              />
            ) : (
              'None'
            )}
          </div>
        </>
      }
      labelSpan={9}
      valueSpan={15}
    />
  );
}

export function UnmintedRow({ collectionId, badgeId }: { collectionId?: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  const mintSupplyBalance = collection?.getBadgeBalances('Mint') ?? new BalanceArray<bigint>();
  return (
    <>
      {collection && (
        <TableRow
          label={'Unminted'}
          value={
            <div style={{ float: 'right' }}>
              <BalanceDisplay
                floatToRight
                hideBadges
                collectionId={collection.collectionId}
                hideMessage
                balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, mintSupplyBalance) : mintSupplyBalance}
              />
            </div>
          }
          labelSpan={8}
          valueSpan={16}
        />
      )}
    </>
  );
}

export function TotalSupplyRow({ collectionId, badgeId }: { collectionId?: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  const totalSupplyBalance = collection?.getBadgeBalances('Total') ?? new BalanceArray<bigint>();
  return (
    <>
      {collection && totalSupplyBalance.length > 0 && (
        <>
          <TableRow
            label={collection.defaultBalances.balances.length > 0 ? 'Created' : 'Circulating (Total Supply)'}
            value={
              <div style={{ float: 'right' }}>
                <BalanceDisplay
                  hideBadges
                  floatToRight
                  collectionId={collection.collectionId}
                  showingSupplyPreview
                  hideMessage
                  balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, totalSupplyBalance) : totalSupplyBalance}
                />
              </div>
            }
            labelSpan={8}
            valueSpan={16}
          />
          {collection.defaultBalances.balances.length > 0 && totalSupplyBalance.length > 0 && (
            <>
              <div className="secondary-text">
                <InfoCircleOutlined /> In addition to the default balances, badges can be created and distributed.
              </div>
              <br />
            </>
          )}
        </>
      )}
    </>
  );
}

export function NumUniqueBadgesRow({ collectionId }: { collectionId?: bigint }) {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  const maxBadgeId = collection.getMaxBadgeId();
  return (
    <TableRow
      label={'Unique Badges'}
      value={`${maxBadgeId}${maxBadgeId > 0 ? ` (IDs ${getBadgeIdsString([{ start: 1n, end: maxBadgeId }])})` : ''}`}
      labelSpan={12}
      valueSpan={12}
    />
  );
}

export function CanCreateMoreBadgesRow({ collectionId, badgeId }: { collectionId?: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  return (
    <TableRow
      label={'Can more badges be created?'}
      value={
        <PermissionIcon
          permissionName="canCreateMoreBadges"
          permissions={collection.collectionPermissions.canCreateMoreBadges}
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? UintRangeArray.From([{ start: badgeId, end: badgeId }]) : undefined}
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  );
}

export function CanUpdateTransferabilityDisplay({ collectionId, badgeId }: { collectionId?: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  return (
    <TableRow
      label={'Can transferability be updated?'}
      value={
        <PermissionIcon
          permissionName="canUpdateCollectionApprovals"
          permissions={collection.collectionPermissions.canUpdateCollectionApprovals}
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? UintRangeArray.From([{ start: badgeId, end: badgeId }]) : undefined}
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  );
}

export function BalancesUrlRow({ collectionId }: { collectionId?: bigint }) {
  const collection = useCollection(collectionId);
  return (
    <TableRow
      label={'Balances URL'}
      value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                return (
                  <>
                    <Tooltip placement="bottom" title={timelineVal.offChainBalancesMetadata.uri}>
                      <a
                        href={
                          timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://')
                            ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal.offChainBalancesMetadata.uri.slice(7)}`
                            : timelineVal.offChainBalancesMetadata.uri
                        }
                        target="_blank"
                        rel="noreferrer">
                        View Source
                        <LinkOutlined style={{ marginLeft: 4 }} />
                      </a>
                    </Tooltip>
                    {timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://') ? (
                      <Tooltip
                        placement="bottom"
                        title="This metadata URL uses permanent storage, meaning this URL will always return the same metadata.">
                        <LockOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    ) : (
                      <Tooltip placement="bottom" title="This metadata does not use permanent storage, meaning the data may change.">
                        <EditOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    )}
                  </>
                );
              }}
              emptyNode={<>None</>}
              timeline={collection?.offChainBalancesMetadataTimeline ?? []}
            />
          </>
        </div>
      }
      labelSpan={9}
      valueSpan={15}
    />
  );
}

export function CanUpdateBalancesUrlRow({ collectionId, badgeId }: { collectionId?: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  return (
    <TableRow
      label={'Can balances URL be updated?'}
      value={
        <PermissionIcon
          permissions={collection.collectionPermissions.canUpdateOffChainBalancesMetadata}
          permissionName="canUpdateOffChainBalancesMetadata"
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? UintRangeArray.From([{ start: badgeId, end: badgeId }]) : undefined}
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  );
}

export function DistributionOverview({
  collectionId,
  span,
  badgeId,
  isSelectStep,
  xs,
  sm,
  md,
  style,
  lg,
  xl,
  xxl,
  hideTitle,
  noBorder,
  inheritBg,
  noPadding
}: {
  collectionId: bigint;
  span?: number;
  badgeId?: bigint;
  isSelectStep?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  style?: React.CSSProperties;
  hideTitle?: boolean;
  noBorder?: boolean;
  inheritBg?: boolean;
  noPadding?: boolean;
}) {
  const collection = useCollection(collectionId);

  if (!collection) return <></>;
  if (!collection?.collectionPermissions) return <></>;

  const isBadgeView = badgeId !== undefined;

  const isOffChainBalances = collection && collection.balancesType == 'Off-Chain - Indexed' ? true : false;
  const totalSupplyBalance = collection?.owners.find((x) => x.cosmosAddress === 'Total')?.balances ?? [];
  const isNonIndexed = collection && collection.balancesType == 'Off-Chain - Non-Indexed' ? true : false;

  return (
    <InformationDisplayCard
      noBorder={noBorder}
      inheritBg={inheritBg}
      noPadding={noPadding}
      title={hideTitle ? '' : 'Distribution'}
      span={span}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      style={style}>
      {collection && !isSelectStep && <BalancesStorageRow collectionId={collectionId} />}
      {collection && collection.defaultBalances.balances.length > 0 && !isNonIndexed && totalSupplyBalance.length > 0 && (
        <DefaultBalancesRow collectionId={collectionId} />
      )}
      {!isNonIndexed && <TotalSupplyRow collectionId={collectionId} badgeId={badgeId} />}
      {!isSelectStep && !isNonIndexed && <UnmintedRow collectionId={collectionId} badgeId={badgeId} />}
      {!isBadgeView && <NumUniqueBadgesRow collectionId={collectionId} />}
      {!isSelectStep && <CanCreateMoreBadgesRow collectionId={collectionId} badgeId={badgeId} />}
      {!isSelectStep && !isOffChainBalances && !isNonIndexed && <CanUpdateTransferabilityDisplay collectionId={collectionId} badgeId={badgeId} />}

      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <BalancesUrlRow collectionId={collectionId} />}
      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <CanUpdateBalancesUrlRow collectionId={collectionId} badgeId={badgeId} />}
      {isOffChainBalances && !isSelectStep && <BalancesLastUpdatedRow collectionId={collectionId} />}

      {!isSelectStep && <BalanceTypeDescription collectionId={collectionId} />}
    </InformationDisplayCard>
  );
}

export const BalancesLastUpdatedRow = ({ collectionId }: { collectionId: bigint }) => {
  const collection = useCollection(collectionId);
  const lastFetchedAt = collection?.owners.find((x) => x.cosmosAddress === 'Mint')?.fetchedAt ?? 0n;

  if (collection?.balancesType !== 'Off-Chain - Indexed') return <></>;

  return (
    <TableRow
      label={'Last Updated'}
      value={<div>{lastFetchedAt ? new Date(Number(lastFetchedAt)).toLocaleString() : '...'}</div>}
      labelSpan={9}
      valueSpan={15}
    />
  );
};

export const BalanceTypeDescription = ({ collectionId }: { collectionId: bigint }) => {
  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  const isOffChainBalances = collection && collection.balancesType == 'Off-Chain - Indexed' ? true : false;
  const isNonIndexed = collection && collection.balancesType == 'Off-Chain - Non-Indexed' ? true : false;

  return (
    <>
      {isNonIndexed && (
        <>
          <br />
          <div className="secondary-text">
            <InfoCircleOutlined /> This collection uses non-indexed balances, meaning balances are stored off-chain via a host server and fetched
            on-demand. There are no on-chain transfer or approval transactions. There is no verifiable total supply, and balances do not show up in
            search results. The only way to view balances is to manually query.
          </div>
        </>
      )}
      {isOffChainBalances && (
        <>
          <br />
          <div className="secondary-text">
            <InfoCircleOutlined /> This collection uses indexed off-chain balances. Balances are stored off-chain and fetched from a host server.
            There are no on-chain transfer or approval transactions.
          </div>
        </>
      )}
      {!isOffChainBalances && !isNonIndexed && (
        <>
          <br />
          <div className="secondary-text">
            <InfoCircleOutlined /> This collection stores balances on the blockchain. Badges are received and sent via blockchain transactions.
          </div>
        </>
      )}
    </>
  );
};
