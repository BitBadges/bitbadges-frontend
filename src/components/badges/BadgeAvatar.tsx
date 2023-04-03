import { Avatar, Spin, Tooltip } from "antd";
import { BadgeMetadata, BitBadgeCollection, UserBalance, getSupplyByBadgeId } from "bitbadges-sdk";
import { useRouter } from "next/router";

export function BadgeAvatar({
    collection,
    metadata,
    size,
    badgeId,
    balance,
    showId,
    showBalance,
}: {
    collection: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
    balance?: UserBalance,
    showId?: boolean,
    showBalance?: boolean,
}) {
    const router = useRouter();

    return metadata ? <div>
        <Tooltip
            placement="bottom"
            title={`${metadata.name ? metadata.name : ''} (ID: ${badgeId})`}
        // open={modalIsVisible ? false : undefined}
        >
            <div style={{ textAlign: 'center' }}>
                <Avatar
                    style={{
                        verticalAlign: 'middle',
                        border: `1px solid ${metadata.color || 'black'}`,
                        margin: 4,
                        cursor: 'pointer',
                    }}
                    className="badge-avatar"
                    src={metadata.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : <Spin />}
                    size={size ? size : 50}
                    onClick={() => {
                        router.push(`/collections/${collection.collectionId}/${badgeId}`)
                    }}
                    onError={() => {
                        return false;
                    }}
                />

            </div>
        </Tooltip>
        <div style={{ textAlign: 'center' }}>
            {showId && <b><span>{badgeId}</span></b>}
            {balance && showBalance && <> <br />
                <b>
                    x<span style={{
                        color: getSupplyByBadgeId(badgeId, balance.balances) < 0 ? 'red' : undefined
                    }}>
                        {getSupplyByBadgeId(badgeId, balance.balances)}
                    </span>
                </b>
            </>}
        </div>
    </div> : <div style={{ textAlign: 'center' }}>
        <Avatar
            style={{
                verticalAlign: 'middle',
                margin: 4,
                cursor: 'pointer',
            }}
            className="badge-avatar"
            src={<Spin />}
            size={size ? size : 50}
            onClick={() => router.push(`/collections/${collection.collectionId}/${badgeId}`)}
            onError={() => {
                return false;
            }}
        />
        <br />
        {showId && <b><span>{badgeId}</span></b>}
        {balance && showBalance && <> <br />
            <b>
                <span style={{
                    color: getSupplyByBadgeId(badgeId, balance.balances) < 0 ? 'red' : undefined
                }}>
                    x{getSupplyByBadgeId(badgeId, balance.balances)}
                </span>
            </b>
        </>}
    </div>
}