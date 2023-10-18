import { EditOutlined, LinkOutlined, LockOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { OffChainBalancesMetadataTimeline } from "bitbadgesjs-proto";
import { BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, castBalancesActionPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, getBalancesForId } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { PermissionIcon } from "../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { TimelineFieldWrapper } from "../wrappers/TimelineFieldWrapper";
import { BalanceDisplay } from "./balances/BalanceDisplay";
import { getTotalNumberOfBadges } from "../../bitbadges-api/utils/badges";

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
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  if (!collection) return <></>;
  if (!collection?.collectionPermissions) return <></>

  const isBadgeView = badgeId !== undefined;

  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;
  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
  const mintSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];
  const maxBadgeId = getTotalNumberOfBadges(collection);

  const lastFetchedAt = collection.owners.find(x => x.cosmosAddress === "Mint")?.fetchedAt ?? 0n

  return <InformationDisplayCard title={'Distribution'} span={span} xs={xs} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl} style={style}>
    <>
      {collection && <TableRow label={"Circulating (Total)"} value={
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
      } labelSpan={8} valueSpan={16} />}
      {!isSelectStep && <>
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
        <TableRow label={"Number of Unique Badges"} value={`${maxBadgeId}`} labelSpan={12} valueSpan={12} />}
      {!isSelectStep && <TableRow label={"Can more badges be created?"} value={PermissionIcon(
        "canCreateMoreBadges",
        castBalancesActionPermissionToUniversalPermission(
          collection.collectionPermissions.canCreateMoreBadges), BalancesActionPermissionUsedFlags, collection.managerTimeline.length == 0 ||
      collection.managerTimeline.every(x => !x.manager), badgeId ? [{ start: badgeId, end: badgeId }] : undefined)} labelSpan={20} valueSpan={4} />}
      {isOffChainBalances && !isSelectStep && <TableRow label={"Balances URL"} value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                return <><Tooltip placement='bottom' title={timelineVal.offChainBalancesMetadata.uri}>
                  <a href={timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${timelineVal.offChainBalancesMetadata.uri.slice(7)}` : timelineVal.offChainBalancesMetadata.uri

                  } target="_blank" rel="noreferrer">
                    View
                    <LinkOutlined style={{ marginLeft: 4 }} /></a>
                </Tooltip>
                  {timelineVal.offChainBalancesMetadata.uri.startsWith('ipfs://')
                    ? <Tooltip placement='bottom' title='This metadata URL uses permanent storage, meaning this URL will always return the same metadata.'>
                      <LockOutlined style={{ marginLeft: 4 }} />
                    </Tooltip> :
                    <Tooltip placement='bottom' title='This metadata does not use permanent storage, meaning the metadata may change.'>
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
      {isOffChainBalances && !isSelectStep && <TableRow label={"Update balances URL?"} value={
        PermissionIcon(
          "canUpdateOffChainBalancesMetadata",
          castTimedUpdatePermissionToUniversalPermission(

            collection.collectionPermissions.canUpdateOffChainBalancesMetadata), TimedUpdatePermissionUsedFlags, collection.managerTimeline.length == 0 ||
        collection.managerTimeline.every(x => !x.manager), badgeId ? [{ start: badgeId, end: badgeId }] : undefined)
      } labelSpan={9} valueSpan={15} />}
      {isOffChainBalances && !isSelectStep && <TableRow label={"Last Updated"} value={
        <div>
          <>
            {lastFetchedAt ? new Date(Number(lastFetchedAt)).toLocaleString() : '...'}
          </>
        </div>
      } labelSpan={9} valueSpan={15} />}
    </>
  </InformationDisplayCard>
}