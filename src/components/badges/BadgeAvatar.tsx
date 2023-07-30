import { Avatar, Badge, Spin, Tooltip } from "antd";
import { getBalanceForIdAndTime, getMetadataForBadgeId } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { ClockCircleOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { Balance } from "bitbadgesjs-proto";
import { FOREVER_DATE, getTimeRangesString } from "../../utils/dates";

export function BadgeAvatar({
  collectionId,
  size,
  badgeId,
  balances,
  showId,
}: {
  collectionId: bigint,
  badgeId?: bigint,
  size?: number,
  balances?: Balance<bigint>[],
  showId?: boolean,
}) {
  const router = useRouter();
  const collections = useCollectionsContext();

  const collection = collections.collections[collectionId.toString()]
  const metadata = badgeId ? getMetadataForBadgeId(badgeId, collection?.badgeMetadata ?? []) : collection?.collectionMetadata;

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances) : 0n;
  const showOwnedTimesIcon = badgeId && balances ?
    JSON.stringify(balances) !== JSON.stringify([{ start: 1n, end: FOREVER_DATE }])
    : false;

  return <div>
    <Tooltip
      placement="bottom"
      title={`${metadata?.name ? metadata.name : ''} (ID: ${badgeId})`}
    >
      <div style={{ textAlign: 'center' }}>
        <Badge
          count={<Tooltip title={`This collection\'s metadata${collection && collection.offChainBalancesMetadataTimeline.length > 0 ? ' and balances are' : ' is'} currently being refreshed.`}>
            <CloudSyncOutlined />
          </Tooltip>
          }
          style={{ backgroundColor: 'blue' }}
        >
          <Avatar
            style={{
              verticalAlign: 'middle',
              border: `1px solid ${metadata?.color || 'black'}`,
              margin: 4,
              cursor: collection ? 'pointer' : undefined,
            }}
            className="badge-avatar"
            src={metadata?.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : <Spin />}
            size={size ? size : 50}
            onClick={() => {
              if (collectionId === 0n) {
                prompt('Navigating to this badge will cause you to lose your progress. Continue?')
                return;
              }
              router.push(`/collections/${collectionId}/${badgeId}`)
            }}
            onError={() => {
              return false;
            }}
          />
        </Badge>

      </div>
    </Tooltip>
    <div style={{ textAlign: 'center' }}>
      {showId && <b><span>{`${badgeId}`}</span></b>}
      {!!balances && <>
        <br />
        <b>
          x<span style={{ color: currBalanceAmount < 0 ? 'red' : undefined }}>
            {`${currBalanceAmount}`}
          </span>

          {showOwnedTimesIcon &&
            <Tooltip color='black' title={
              <div>
                {
                  balances.map(x => {
                    return <>
                      x{x.amount} {getTimeRangesString(x.ownedTimes, '', true)}
                      <br />
                    </>
                  })
                }
              </div>
            }>
              <ClockCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          }
        </b>
      </>}
    </div>
  </div>
}