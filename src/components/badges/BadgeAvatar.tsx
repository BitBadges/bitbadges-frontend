import { Avatar, Badge, Spin, Tooltip } from "antd";
import { getMetadataForBadgeId } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { CloudSyncOutlined } from "@ant-design/icons";

export function BadgeAvatar({
  collectionId,
  size,
  badgeId,
  balance,
  showId,
}: {
  collectionId: bigint,
  badgeId?: bigint,
  size?: number,
  balance?: bigint,
  showId?: boolean,
}) {
  const router = useRouter();
  const collections = useCollectionsContext();

  const collection = collections.getCollection(collectionId);
  const metadata = badgeId ? getMetadataForBadgeId(badgeId, collection?.badgeMetadata ?? []) : collection?.collectionMetadata;

  return <div>
    <Tooltip
      placement="bottom"
      title={`${metadata?.name ? metadata.name : ''} (ID: ${badgeId})`}
    >
      <div style={{ textAlign: 'center' }}>
        <Badge
          count={<Tooltip title={`This collection\'s metadata${collection && collection.balancesUri ? ' and balances are' : ' is'} currently being refreshed.`}>
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
              if (!collection) return;
              router.push(`/collections/${collection.collectionId}/${badgeId}`)
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
      {!!balance && <>
        <br />
        <b>
          x<span style={{ color: balance < 0 ? 'red' : undefined }}>
            {`${balance}`}
          </span>
        </b>
      </>}
    </div>
  </div>
}