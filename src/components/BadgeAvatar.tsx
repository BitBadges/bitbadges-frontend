import { Avatar, Tooltip } from "antd";
import { BadgeMetadata, BitBadgeCollection } from "../bitbadges-api/types";

export function BadgeAvatar({
    badge,
    metadata,
    size,
    badgeId
}: {
    badge: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
}) {
    return <Tooltip
        placement="bottom"
        title={`${metadata.name} (ID: ${badgeId})`}
    >
        {metadata.image ? (
            <Avatar
                style={{
                    verticalAlign: 'middle',
                    border: '1px solid',
                    borderColor: metadata.color || 'black',
                    margin: 4,
                    cursor: 'pointer',
                }}
                className="badge-avatar"
                src={metadata.image}
                size={size}
                // onClick={() => setModalIsVisible(true)}
                onError={() => {
                    return false;
                }}
            />
        ) : (
            <Avatar
                style={{
                    backgroundColor: metadata.color,
                    verticalAlign: 'middle',
                    border: '1px solid black',
                    margin: 4,
                    cursor: 'pointer',
                }}
                size={size}
                className="badge-avatar"
            // onClick={() => setModalIsVisible(true)}
            ></Avatar>
        )}
    </Tooltip>
}