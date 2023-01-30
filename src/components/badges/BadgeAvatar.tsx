import { Avatar, Tooltip } from "antd";
import { BadgeMetadata, BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { useEffect, useState } from "react";
import { BadgeModal } from "./BadgeModal";

export function BadgeAvatar({
    badge,
    metadata,
    size,
    badgeId,
    balance,
}: {
    badge: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
    balance?: UserBalance,
}) {
    console.log(badgeId)
    const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);

    return metadata ? <Tooltip
        placement="bottom"
        title={`${metadata.name} (ID: ${badgeId})`}
        open={modalIsVisible ? false : undefined}
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
                onClick={() => setModalIsVisible(true)}
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
                onClick={() => setModalIsVisible(true)}
            ></Avatar>
        )}
        <BadgeModal
            badge={badge}
            metadata={metadata}
            visible={modalIsVisible}
            setVisible={setModalIsVisible}
            balance={balance ? balance : {} as UserBalance}
            badgeId={badgeId}
        />
    </Tooltip> : <></>
}