import { Avatar, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { getBlankBalance } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { BadgeModal } from "./BadgeModal";

export function BadgeAvatar({
    collection,
    metadata,
    size,
    badgeId,
    balance,
    showId
}: {
    collection: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
    balance?: UserBalance,
    showId?: boolean,
}) {
    const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);



    return metadata ? <Tooltip
        placement="bottom"
        title={`${metadata.name} (ID: ${badgeId})`}
        open={modalIsVisible ? false : undefined}
    >
        {metadata.image ? (
            <div style={{ textAlign: 'center' }}>
                <Avatar
                    style={{
                        verticalAlign: 'middle',
                        border: `1px solid ${metadata.color || 'black'}`,
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
                <br />
                {showId && <span>{badgeId}</span>}
            </div>
        ) : (
            <div style={{ textAlign: 'center' }}>

                <Avatar
                    style={{
                        backgroundColor: metadata.color,
                        border: `1px solid ${metadata.color || 'black'}`,
                        verticalAlign: 'middle',
                        margin: 4,
                        cursor: 'pointer',
                    }}
                    size={size}
                    className="badge-avatar"
                    onClick={() => setModalIsVisible(true)}
                ></Avatar>
                <br />
                {showId && <span style={{ color: PRIMARY_TEXT }}>{badgeId}</span>}
            </div>
        )}
        <BadgeModal
            collection={collection}
            metadata={metadata}
            visible={modalIsVisible}
            setVisible={setModalIsVisible}
            balance={balance ? balance : getBlankBalance()}
            badgeId={badgeId}
        />
    </Tooltip> : <></>
}