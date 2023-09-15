import { ClockCircleOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { Avatar, Badge, Spin, Tooltip } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { DefaultPlaceholderMetadata, Metadata, getBalanceForIdAndTime, getMetadataForBadgeId } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64, getTimeRangesString } from "../../utils/dates";

export function BadgeAvatar({
  collectionId,
  size,
  badgeId,
  balances,
  showId,
  showSupplys,
  noHover,
  metadataOverride,
  noBorder,
}: {
  collectionId: bigint,
  badgeId?: bigint,
  size?: number,
  balances?: Balance<bigint>[],
  showId?: boolean,
  showSupplys?: boolean,
  noHover?: boolean,
  metadataOverride?: Metadata<bigint>
  noBorder?: boolean
}) {
  const router = useRouter();
  const collections = useCollectionsContext();

  const collection = collections.collections[collectionId.toString()]
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? []) : collection?.cachedCollectionMetadata;

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances) : 0n;
  const showOwnershipTimesIcon = badgeId && balances && showSupplys ? balances.some(x => x.ownershipTimes.length == 1 && x.ownershipTimes[0].start !== 1n && x.ownershipTimes[0].end !== GO_MAX_UINT_64) : false;

  const avatar = <Avatar
    style={{
      verticalAlign: 'middle',
      border: noBorder ? undefined : `1px solid ${metadata?.color || 'black'}`,
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
      router.push(`/collections/${collectionId}/${badgeId}`)
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
      {showId && <b><span>{`${badgeId}`}</span><br /></b>}
      {!!balances && <>


        <b>
          {showSupplys && <>
            x<span style={{ color: currBalanceAmount < 0 ? 'red' : undefined }}>
              {`${currBalanceAmount}`}
            </span></>}

          {showOwnershipTimesIcon &&
            <Tooltip color='black' title={
              <div>
                {
                  balances.map((x, idx) => {
                    return <>
                      {idx > 0 && <br />}

                      {idx > 0 && <br />}

                      x{x.amount.toString()} from {getTimeRangesString(x.ownershipTimes, '', true)}

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