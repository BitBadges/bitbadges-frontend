import { ClockCircleOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { Avatar, Badge, Spin, Tooltip } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { DefaultPlaceholderMetadata, getBalanceForIdAndTime, getMetadataForBadgeId } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE, getTimeRangesString } from "../../utils/dates";

export function BadgeAvatar({
  collectionId,
  size,
  badgeId,
  balances,
  showId,
  showSupplys,
  noHover
}: {
  collectionId: bigint,
  badgeId?: bigint,
  size?: number,
  balances?: Balance<bigint>[],
  showId?: boolean,
  showSupplys?: boolean,
  noHover?: boolean
}) {
  const router = useRouter();
  const collections = useCollectionsContext();

  const collection = collections.collections[collectionId.toString()]
  const metadata = badgeId ? getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []) : collection?.cachedCollectionMetadata;

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances) : 0n;
  const showOwnershipTimesIcon = badgeId && balances && showSupplys ?
    JSON.stringify(balances) !== JSON.stringify([{ start: 1n, end: FOREVER_DATE }])
    : false;

  const avatar = <Avatar
    style={{
      verticalAlign: 'middle',
      border: `1px solid ${metadata?.color || 'black'}`,
      margin: 4,
      cursor: collection && badgeId ? 'pointer' : undefined,
    }}
    className={badgeId && !noHover ? 'badge-avatar' : undefined}
    src={metadata?.image
      ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : metadata && !metadata.image ? DefaultPlaceholderMetadata.image : <Spin />}
    size={size ? size : 50}
    onClick={() => {
      if (!badgeId) return;

      if (collectionId === 0n) {
        if (confirm('Navigating to this badge will cause you to lose your progress. Continue?')) {
          router.push(`/collections/${collectionId}/${badgeId}`)
        }
      } else router.push(`/collections/${collectionId}/${badgeId}`)
    }}
    onError={() => {
      return false;
    }}
  />

  return <div>
    {noHover ? avatar :
      <Tooltip
        placement="bottom"
        title={`${metadata?.name ? metadata.name : ''} ${badgeId ? `(#${badgeId})` : ''}`}
      >
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={metadata?._isUpdating ? <Tooltip title={`This collection\'s metadata${collection && collection.balancesType === "Off-Chain" ? ' and balances are' : ' is'} currently being refreshed.`}>
              <CloudSyncOutlined className='primary-text' size={30} style={{ fontSize: 20 }} />
            </Tooltip> : <></>
            }
            style={{ backgroundColor: 'blue' }}
          >
            {avatar}
          </Badge>

        </div>
      </Tooltip>}
    <div style={{ textAlign: 'center' }}>
      {showId && <b><span>{`${badgeId}`}</span></b>}
      {!!balances && <>
        <br />
        <b>
          {showSupplys && <>
            x<span style={{ color: currBalanceAmount < 0 ? 'red' : undefined }}>
              {`${currBalanceAmount}`}
            </span></>}

          {showOwnershipTimesIcon &&
            <Tooltip color='black' title={
              <div>
                {
                  balances.map(x => {
                    return <>
                      x{x.amount.toString()} owned from {getTimeRangesString(x.ownershipTimes, '', true)}
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