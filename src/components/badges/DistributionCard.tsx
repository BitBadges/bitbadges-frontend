import { castBalancesActionPermissionToUniversalPermission, getBalancesForId, BalancesActionPermissionUsedFlags } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { BalanceDisplay } from "./balances/BalanceDisplay";
import { PermissionIcon } from "../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { OffChainBalancesMetadataTimeline } from "bitbadgesjs-proto";
import { LinkOutlined, LockOutlined, EditOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { TimelineFieldWrapper } from "../wrappers/TimelineFieldWrapper";

export function DistributionOverview({
  collectionId,
  span,
  badgeId
}: {
  collectionId: bigint
  span?: number
  badgeId?: bigint
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  if (!collection?.collectionPermissions) return <></>

  const isBadgeView = badgeId !== undefined;

  if (!collection) return <></>;


  // EXPERIMENTAL STANDARD
  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;

  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
  const mintSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];

  let maxBadgeId = 0n;
  for (const balance of totalSupplyBalance) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }
  }


  return <InformationDisplayCard title={'Distribution'} span={span}>
    <>
      {!isBadgeView &&
        <TableRow label={"Number of Badges"} value={`${maxBadgeId}`} labelSpan={12} valueSpan={12} />}
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
          <br />
        </div>
      } labelSpan={8} valueSpan={16} />}
      {<>
        {collection && <TableRow label={"Unminted"} value={
          <div style={{ float: 'right' }}>
            <BalanceDisplay
              floatToRight
              hideBadges
              collectionId={collectionId}
              hideMessage
              balances={badgeId && badgeId > 0n ? getBalancesForId(badgeId, mintSupplyBalance) : mintSupplyBalance}
            />
            <br />

          </div>
        } labelSpan={8} valueSpan={16} />}
      </>}
      {<TableRow label={"Can more badges be created?"} value={PermissionIcon(castBalancesActionPermissionToUniversalPermission(collection.collectionPermissions.canCreateMoreBadges), "", BalancesActionPermissionUsedFlags, collection.managerTimeline.length == 0 ||
        collection.managerTimeline.every(x => !x.manager), badgeId)} labelSpan={20} valueSpan={4} />}
      {isOffChainBalances && <TableRow label={"Balances URL"} value={
        <div>
          <>
            <TimelineFieldWrapper
              createNode={(timelineVal: OffChainBalancesMetadataTimeline<bigint>) => {
                return <><Tooltip placement='bottom' title={timelineVal.offChainBalancesMetadata.uri}>
                  <a href={timelineVal.offChainBalancesMetadata.uri} target="_blank" rel="noreferrer">
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
    </>
  </InformationDisplayCard>
}