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
    showId,
    hackyUpdatedFlag,
}: {
    collection: BitBadgeCollection,
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
            collection={collection}
            metadata={displayMetadata}
            visible={modalIsVisible}
            setVisible={setModalIsVisible}
            balance={balance ? balance : getBlankBalance()}
            badgeId={badgeId}
        />
    </Tooltip> : <></>
}