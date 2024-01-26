import {
  EditOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LockOutlined,
} from "@ant-design/icons"
import { Tooltip } from "antd"
import { OffChainBalancesMetadataTimeline } from "bitbadgesjs-proto"
import {
  BitBadgesCollection,
  getBalancesForId
} from "bitbadgesjs-utils"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { neverHasManager } from "../../bitbadges-api/utils/manager"
import { getBadgeIdsString } from "../../utils/badgeIds"
import { BalanceDisplay } from "../balances/BalanceDisplay"
import { PermissionIcon } from "../collection-page/PermissionsInfo"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { TableRow } from "../display/TableRow"
import { TimelineFieldWrapper } from "../wrappers/TimelineFieldWrapper"

export function BalancesStorageRow({ collection }: { collection: BitBadgesCollection<bigint> }) {

  return (
    <TableRow
      label={"Balances Storage"}
      value={
        <>
          <div
            className=""
            style={{
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
            }}
          >
            {collection?.balancesType === "Off-Chain - Indexed" ? (
              <div>
                <>
                  <TimelineFieldWrapper
                    createNode={(
                      timelineVal: OffChainBalancesMetadataTimeline<bigint>
                    ) => {
                      return (
                        <a
                          href={
                            timelineVal?.offChainBalancesMetadata.uri.startsWith(
                              "ipfs://"
                            )
                              ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal?.offChainBalancesMetadata.uri.substring(
                                7
                              )}`
                              : timelineVal?.offChainBalancesMetadata.uri
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Off-Chain
                        </a>
                      )
                    }}
                    emptyNode={<>None</>}
                    timeline={
                      collection?.offChainBalancesMetadataTimeline ?? []
                    }
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
  )
}

export function DefaultBalancesRow({ collection }: { collection: BitBadgesCollection<bigint> }) {
  return (
    <TableRow
      label={"Default Balances"}
      value={
        <>
          <div
            className=""
            style={{
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
            }}
          >
            {collection?.defaultBalances.balances.length > 0 ? (
              <BalanceDisplay
                hideBadges
                floatToRight
                collectionId={collection.collectionId}
                hideMessage
                balances={collection.defaultBalances.balances}
              />
            ) : (
              "None"
            )}
          </div>
        </>
      }
      labelSpan={9}
      valueSpan={15}
    />
  )
}


export function UnmintedRow({ collection, badgeId }: { collection: BitBadgesCollection<bigint>, badgeId?: bigint }) {
  const mintSupplyBalance = collection?.owners.find((x) => x.cosmosAddress === "Mint")?.balances ?? []
  return (
    <>
      {collection && (
        <TableRow
          label={"Unminted"}
          value={
            <div style={{ float: "right" }}>
              <BalanceDisplay
                floatToRight
                hideBadges
                collectionId={collection.collectionId}
                hideMessage
                balances={
                  badgeId && badgeId > 0n
                    ? getBalancesForId(badgeId, mintSupplyBalance)
                    : mintSupplyBalance
                }
              />
            </div>
          }
          labelSpan={8}
          valueSpan={16}
        />
      )}
    </>
  )
}

export function TotalSupplyRow({ collection, badgeId }: { collection: BitBadgesCollection<bigint>, badgeId?: bigint }) {
  const totalSupplyBalance = collection?.owners.find((x) => x.cosmosAddress === "Total")?.balances ?? []
  return <>
    {collection && totalSupplyBalance.length > 0 && (
      <>
        <TableRow
          label={
            collection.defaultBalances.balances.length > 0
              ? "Created"
              : "Circulating (Total Supply)"
          }
          value={
            <div style={{ float: "right" }}>
              <BalanceDisplay
                hideBadges
                floatToRight
                collectionId={collection.collectionId}
                showingSupplyPreview
                hideMessage
                balances={
                  badgeId && badgeId > 0n
                    ? getBalancesForId(badgeId, totalSupplyBalance)
                    : totalSupplyBalance
                }
              />
            </div>
          }
          labelSpan={8}
          valueSpan={16}
        />
        {collection.defaultBalances.balances.length > 0 &&
          totalSupplyBalance.length > 0 && (
            <>
              <div className="secondary-text">
                <InfoCircleOutlined /> In addition to the default balances,
                badges can be created and distributed.
              </div>
              <br />
            </>
          )}
      </>
    )}
  </>
}


export function NumUniqueBadgesRow({ collection }: { collection: BitBadgesCollection<bigint> }) {
  const maxBadgeId = getMaxBadgeIdForCollection(collection)
  return (
    <TableRow
      label={"Number of Unique Badges"}
      value={`${maxBadgeId}${maxBadgeId > 0
        ? ` (IDs ${getBadgeIdsString([
          { start: 1n, end: maxBadgeId },
        ])})`
        : ""
        }`}
      labelSpan={12}
      valueSpan={12}
    />
  )
}

export function CanCreateMoreBadgesRow({ collection, badgeId }: { collection: BitBadgesCollection<bigint>, badgeId?: bigint }) {
  return (
    <TableRow
      label={"Can more badges be created?"}
      value={
        <PermissionIcon
          permissionName="canCreateMoreBadges"
          permissions={collection.collectionPermissions.canCreateMoreBadges}
          neverHasManager={neverHasManager(collection)}
          badgeIds={
            badgeId ? [{ start: badgeId, end: badgeId }] : undefined
          }
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  )
}

export function CanUpdateTransferabilityDisplay({ collection, badgeId }: { collection: BitBadgesCollection<bigint>, badgeId?: bigint }) {
  return (
    <TableRow
      label={"Can transferability be updated?"}
      value={
        <PermissionIcon
          permissionName="canUpdateCollectionApprovals"
          permissions={collection.collectionPermissions.canUpdateCollectionApprovals}
          neverHasManager={neverHasManager(collection)}
          badgeIds={
            badgeId ? [{ start: badgeId, end: badgeId }] : undefined
          }
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  )
}

export function BalancesUrlRow({ collection }: { collection: BitBadgesCollection<bigint> }) {
  return (
    <TableRow
      label={"Balances URL"}
      value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(
                timelineVal: OffChainBalancesMetadataTimeline<bigint>
              ) => {
                return (
                  <>
                    <Tooltip
                      placement="bottom"
                      title={timelineVal.offChainBalancesMetadata.uri}
                    >
                      <a
                        href={
                          timelineVal.offChainBalancesMetadata.uri.startsWith(
                            "ipfs://"
                          )
                            ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal.offChainBalancesMetadata.uri.slice(
                              7
                            )}`
                            : timelineVal.offChainBalancesMetadata.uri
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Source
                        <LinkOutlined style={{ marginLeft: 4 }} />
                      </a>
                    </Tooltip>
                    {timelineVal.offChainBalancesMetadata.uri.startsWith(
                      "ipfs://"
                    ) ? (
                      <Tooltip
                        placement="bottom"
                        title="This metadata URL uses permanent storage, meaning this URL will always return the same metadata."
                      >
                        <LockOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    ) : (
                      <Tooltip
                        placement="bottom"
                        title="This metadata does not use permanent storage, meaning the data may change."
                      >
                        <EditOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    )}
                  </>
                )
              }}
              emptyNode={<>None</>}
              timeline={
                collection?.offChainBalancesMetadataTimeline ?? []
              }
            />
          </>
        </div>
      }
      labelSpan={9}
      valueSpan={15}
    />
  )
}

export function CanUpdateBalancesUrlRow({ collection, badgeId }: { collection: BitBadgesCollection<bigint>, badgeId?: bigint }) {
  return (
    <TableRow
      label={"Can balances URL be updated?"}
      value={
        <PermissionIcon
          permissions={collection.collectionPermissions.canUpdateOffChainBalancesMetadata}
          permissionName="canUpdateOffChainBalancesMetadata"
          neverHasManager={neverHasManager(collection)}
          badgeIds={
            badgeId ? [{ start: badgeId, end: badgeId }] : undefined
          }
        />
      }
      labelSpan={20}
      valueSpan={4}
    />
  )
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
}: {
  collectionId: bigint
  span?: number
  badgeId?: bigint
  isSelectStep?: boolean
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  xxl?: number
  style?: React.CSSProperties
  hideTitle?: boolean
  noBorder?: boolean
  inheritBg?: boolean
}) {
  const collection = useCollection(collectionId)

  if (!collection) return <></>
  if (!collection?.collectionPermissions) return <></>

  const isBadgeView = badgeId !== undefined

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain - Indexed" ? true : false
  const totalSupplyBalance = collection?.owners.find((x) => x.cosmosAddress === "Total")?.balances ?? []
  const lastFetchedAt = collection.owners.find((x) => x.cosmosAddress === "Mint")?.fetchedAt ?? 0n
  const isNonIndexed = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;

  return (
    <InformationDisplayCard
      noBorder={noBorder}
      inheritBg={inheritBg}
      title={hideTitle ? "" : "Distribution"}
      span={span}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      style={style}
    >
      {collection && !isSelectStep && <BalancesStorageRow collection={collection} />}
      {collection && collection.defaultBalances.balances.length > 0 && !isNonIndexed && totalSupplyBalance.length > 0 && <DefaultBalancesRow collection={collection} />}
      {!isNonIndexed && <TotalSupplyRow collection={collection} badgeId={badgeId} />}
      {!isSelectStep && !isNonIndexed && <UnmintedRow collection={collection} badgeId={badgeId} />}
      {!isBadgeView && <NumUniqueBadgesRow collection={collection} />}
      {!isSelectStep && <CanCreateMoreBadgesRow collection={collection} badgeId={badgeId} />}
      {!isSelectStep && !isOffChainBalances && !isNonIndexed && <CanUpdateTransferabilityDisplay collection={collection} badgeId={badgeId} />}
      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <BalancesUrlRow collection={collection} />}
      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <CanUpdateBalancesUrlRow collection={collection} badgeId={badgeId} />}
      {isOffChainBalances && !isSelectStep && (
        <TableRow label={"Last Updated"} value={<div>{lastFetchedAt ? new Date(Number(lastFetchedAt)).toLocaleString() : "..."}</div>}
          labelSpan={9}
          valueSpan={15}
        />
      )}
      {!isSelectStep && (
        <>
          {isNonIndexed && (
            <>
              <br />
              <div className="secondary-text">
                <InfoCircleOutlined /> This collection uses non-indexed
                balances. This means that balances are stored off-chain and
                fetched on-demand. Unlike standard off-chain indexed balances,
                non-indexed balances do not have a verifiable total supply and
                do not show up in search results. The only way to view
                balances is to use the balance checker.
              </div>
            </>
          )}
          {isOffChainBalances && (
            <>
              <br />
              <div className="secondary-text">
                <InfoCircleOutlined /> This collection uses indexed off-chain
                balances. This means that balances are stored off-chain and
                fetched from the host server. They have a verifiable total
                supply, an indexed ledger of update activity, and show up in
                search results like portfolios.
              </div>
            </>
          )}
          {!isOffChainBalances && !isNonIndexed && (
            <>
              <br />
              <div className="secondary-text">
                <InfoCircleOutlined /> This collection uses standard on-chain
                balances. This means that balances are stored on-chain and are
                updated via transfer and approval blockchain transactions. It
                has a verifiable total supply, an indexed ledger of update
                activity, and will show up in search results like portfolios.
              </div>
            </>
          )}
        </>
      )}

    </InformationDisplayCard>
  )
}
