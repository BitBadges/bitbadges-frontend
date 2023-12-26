import { EditOutlined, InfoCircleOutlined, LinkOutlined, LockOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { OffChainBalancesMetadataTimeline } from "bitbadgesjs-proto";
import { ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, getBalancesForId } from "bitbadgesjs-utils";

import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { getTotalNumberOfBadges } from "../../bitbadges-api/utils/badges";
import { neverHasManager } from "../../bitbadges-api/utils/manager";
import { getBadgeIdsString } from "../../utils/badgeIds";
import { PermissionIcon } from "../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { TimelineFieldWrapper } from "../wrappers/TimelineFieldWrapper";
import { BalanceDisplay } from "./balances/BalanceDisplay";

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
  inheritBg
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

  const collection = useCollection(collectionId);

  if (!collection) return <></>;
  if (!collection?.collectionPermissions) return <></>

  const isBadgeView = badgeId !== undefined;

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain - Indexed" ? true : false;
  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
  const mintSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];
  const maxBadgeId = getTotalNumberOfBadges(collection);



  const lastFetchedAt = collection.owners.find(x => x.cosmosAddress === "Mint")?.fetchedAt ?? 0n

  const isNonIndexed = collection && collection.balancesType == "Off-Chain - Non-Indexed" ? true : false;
  let balancesTypeInfoStr = '';
  if (collection?.balancesType === "Off-Chain - Indexed") {
    balancesTypeInfoStr = 'Balances are stored off the blockchain and controlled via a typical server (chosen by the manager). Transferring and obtaining badges is not facilitated via the blockchain but rather via this server. Balances are indexed, meaning all owners and their balances are known. Also, a log of update activity is kept.';
  } else if (collection?.balancesType === "Standard") {
    balancesTypeInfoStr = 'Transferring and obtaining badges is all facilitated via blockchain transactions.';
  } else if (collection?.balancesType === "Inherited") {
    balancesTypeInfoStr = 'Balances of a badge are inherited from some parent badge. When you obtain or transfer the parent badge, the child badge will also be obtained or transferred.';
  } else if (collection?.balancesType === "Off-Chain - Non-Indexed") {
    balancesTypeInfoStr = 'Balances are stored off-chain and controlled via a typical server. There is no verifiable total supply, and these balances do not show up in standard search results. The only way to view balances is with the balance checker.';
  }

  return <InformationDisplayCard
    noBorder={noBorder} inheritBg={inheritBg}
    title={hideTitle ? '' : 'Distribution'} span={span} xs={xs} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl} style={style}>
    <>
      {collection && !isSelectStep && <TableRow label={"Balances Storage"} value={
        <>
          <div className='' style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
            {collection?.balancesType === "Off-Chain - Indexed" ?
              <div>
                <>
                  <TimelineFieldWrapper
                    createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                      return <a href={timelineVal?.offChainBalancesMetadata.uri.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal?.offChainBalancesMetadata.uri.substring(7)}` : timelineVal?.offChainBalancesMetadata.uri
                      } target='_blank' rel='noreferrer'>Off-Chain</a>
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
          </div>
        </>} labelSpan={9} valueSpan={15} />
      }
      {collection.defaultBalances.balances.length > 0 && <> 
        <TableRow label={"Default Balances"} value={
          <div style={{ float: 'right' }}>
            <BalanceDisplay
              hideBadges
              floatToRight
              collectionId={collectionId}
              hideMessage
              balances={collection.defaultBalances.balances}
            />
          </div>
        } labelSpan={8} valueSpan={16} />
        <div className="secondary-text">
          <InfoCircleOutlined /> Every user is given the default balances upon first interaction.
        </div>
        <br/>
      </>}
      {collection && !isNonIndexed && <><TableRow label={
        collection.defaultBalances.balances.length > 0 ? "Created" : "Circulating (Total Supply)"
      } value={
        <div style={{ float: 'right' }}>
          <BalanceDisplay
            hideBadges
            floatToRight
            collectionId={collectionId}
            showingSupplyPreview
            hideMessage
            balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, totalSupplyBalance) : totalSupplyBalance}
          />
        </div>
      } labelSpan={8} valueSpan={16} />
      {collection.defaultBalances.balances.length > 0 && <>
        <div className="secondary-text">
          <InfoCircleOutlined /> In addition to the default balances, badges can be created and distributed.
          </div>
          <br/>
          </>}
      </>}

      {!isSelectStep && !isNonIndexed && <>
        {collection && <TableRow label={"Unminted"} value={
          <div style={{ float: 'right' }}>
            <BalanceDisplay
              floatToRight
              hideBadges
              collectionId={collectionId}
              hideMessage
              balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, mintSupplyBalance) : mintSupplyBalance}
            />
          </div>
        } labelSpan={8} valueSpan={16} />}
      </>}
      {!isBadgeView &&
        <TableRow label={"Number of Unique Badges"} value={`${maxBadgeId}${maxBadgeId > 0 ? ` (IDs ${getBadgeIdsString([{ start: 1n, end: maxBadgeId }])})` : ''}`} labelSpan={12} valueSpan={12} />}
      {!isSelectStep && <TableRow label={"Can more badges be created?"} value={
        <PermissionIcon
          permissions={castBalancesActionPermissionToUniversalPermission(
            collection.collectionPermissions.canCreateMoreBadges)}
          usedFlags={BalancesActionPermissionUsedFlags}
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? [{ start: badgeId, end: badgeId }] : undefined}
        />} labelSpan={20} valueSpan={4} />}

      {!isSelectStep && !isOffChainBalances && !isNonIndexed && <TableRow label={"Can transferability be updated (including mints)?"} value={
        <PermissionIcon
          permissions={castCollectionApprovalPermissionToUniversalPermission(
            collection.collectionPermissions.canUpdateCollectionApprovals)}
          usedFlags={ApprovalPermissionUsedFlags}
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? [{ start: badgeId, end: badgeId }] : undefined}
        />}
        labelSpan={20} valueSpan={4} />}
      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <TableRow label={"Balances URL"} value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                return <><Tooltip placement='bottom' title={timelineVal.offChainBalancesMetadata.uri}>
                  <a href={timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://') ? `https://bitbadges-ipfs.infura-ipfs.io/ipfs/${timelineVal.offChainBalancesMetadata.uri.slice(7)}` : timelineVal.offChainBalancesMetadata.uri

                  } target="_blank" rel="noreferrer">
                    View
                    <LinkOutlined style={{ marginLeft: 4 }} /></a>
                </Tooltip>
                  {timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://')
                    ? <Tooltip placement='bottom' title='This metadata URL uses permanent storage, meaning this URL will always return the same metadata.'>
                      <LockOutlined style={{ marginLeft: 4 }} />
                    </Tooltip> :
                    <Tooltip placement='bottom' title='This metadata does not use permanent storage, meaning the data may change.'>
                      <EditOutlined style={{ marginLeft: 4 }} />
                    </Tooltip>
                  }
                </>
              }}
              emptyNode={
                <>None</>
              }
              timeline={collection?.offChainBalancesMetadataTimeline ?? []}
            />
          </>
        </div>
      } labelSpan={9} valueSpan={15} />}
      {(isOffChainBalances || isNonIndexed) && !isSelectStep && <TableRow label={"Update balances URL?"} value={
        <PermissionIcon
          permissions={castTimedUpdatePermissionToUniversalPermission(
            collection.collectionPermissions.canUpdateOffChainBalancesMetadata)}
          usedFlags={TimedUpdatePermissionUsedFlags}
          neverHasManager={neverHasManager(collection)}
          badgeIds={badgeId ? [{ start: badgeId, end: badgeId }] : undefined}
        />} labelSpan={9} valueSpan={15} />}

      {(isOffChainBalances) && !isSelectStep && <TableRow label={"Last Updated"} value={
        <div>
          <>
            {lastFetchedAt ? new Date(Number(lastFetchedAt)).toLocaleString() : '...'}
          </>
        </div>
      } labelSpan={9} valueSpan={15} />}
      {!isSelectStep && <>
      {isNonIndexed && <>
        <br />
        <div className="secondary-text">
          <InfoCircleOutlined /> This collection uses non-indexed balances.
          This means that balances are stored off-chain and fetched on-demand.
          Unlike standard off-chain indexed balances, non-indexed balances do not have a verifiable total supply and do not show up in search results.
          The only way to view balances is to use the balance checker.
        </div>
      </>}
      {isOffChainBalances && <>
        <br />
        <div className="secondary-text">
          <InfoCircleOutlined /> This collection uses indexed off-chain balances.
          This means that balances are stored off-chain and fetched from the host server.
          They have a verifiable total supply, an indexed ledger of update activity, and show up in search results like portfolios.
        </div>
      </>}
      {!isOffChainBalances && !isNonIndexed && <>
        <br />
        <div className="secondary-text">
          <InfoCircleOutlined /> This collection uses standard on-chain balances.
          This means that balances are stored on-chain and are updated via transfer and approval blockchain transactions.
          It has a verifiable total supply, an indexed ledger of update activity, and will show up in search results like portfolios.
        </div>
      </>}
      </>}
    </>
  </InformationDisplayCard>
}