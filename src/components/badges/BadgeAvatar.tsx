import { Avatar, Tooltip } from "antd";
import { BadgeMetadata, BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { useEffect, useState } from "react";
import { BadgeModal } from "./BadgeModal";
import { PRIMARY_TEXT } from "../../constants";
import { getBlankBalance, getPostTransferBalance } from '../../bitbadges-api/balances';

export function BadgeAvatar({
    badge,
    metadata,
    size,
    badgeId,
    balance,
    showId,
    hackyUpdatedFlag,
}: {
    badge: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
    balance?: UserBalance,
    showId?: boolean,
    hackyUpdatedFlag?: boolean,
}) {
    const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);
    const [displayMetadata, setDisplayMetadata] = useState<BadgeMetadata>(metadata);

    let stringified = JSON.stringify(metadata);
    useEffect(() => {
        setDisplayMetadata(metadata);
    }, [stringified, metadata, hackyUpdatedFlag]);

    return displayMetadata ? <Tooltip
        placement="bottom"
        title={`${displayMetadata.name} (ID: ${badgeId})`}
        open={modalIsVisible ? false : undefined}
    >
        {displayMetadata.image ? (
            <div style={{ textAlign: 'center' }}>
                <Avatar
                    style={{
                        verticalAlign: 'middle',
                        border: '1px solid',
                        borderColor: displayMetadata.color || 'black',
                        // backgroundColor: metadata?.image
                        //     ? PRIMARY_TEXT
                        //     : metadata?.color,
                        margin: 4,
                        cursor: 'pointer',
                    }}
                    className="badge-avatar"
                    src={displayMetadata.image}
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
                        backgroundColor: displayMetadata.color,
                        borderColor: metadata?.color
                            ? metadata?.color
                            : 'black',
                        verticalAlign: 'middle',
                        border: '1px solid black',
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
            badge={badge}
            metadata={displayMetadata}
            visible={modalIsVisible}
            setVisible={setModalIsVisible}
            balance={balance ? balance : getBlankBalance()}
            badgeId={badgeId}
        />
    </Tooltip> : <></>
}