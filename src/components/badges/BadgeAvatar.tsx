import { Avatar, Spin, Tooltip } from "antd";
import { useState } from "react";
import { getBlankBalance, getSupplyByBadgeId } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeModal } from "./BadgeModal";

export function BadgeAvatar({
    collection,
    metadata,
    size,
    badgeId,
    balance,
    showId,
    showBalance,
    hideModalBalance,
}: {
    collection: BitBadgeCollection,
    metadata: BadgeMetadata,
    size?: number,
    badgeId: number,
    balance?: UserBalance,
    showId?: boolean,
    showBalance?: boolean,
    hideModalBalance?: boolean,
}) {
    const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);

    return metadata ? <div>
        <Tooltip
            placement="bottom"
            title={`${metadata.name} (ID: ${badgeId})`}
            open={modalIsVisible ? false : undefined}
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
                    src={metadata.image ? metadata.image : <Spin />}
                    size={size}
                    onClick={() => setModalIsVisible(true)}
                    onError={() => {
                        return false;
                    }}
                />

            </div>
            <BadgeModal
                collection={collection}
                metadata={metadata}
                visible={modalIsVisible}
                setVisible={setModalIsVisible}
                balance={balance ? balance : getBlankBalance()}
                badgeId={badgeId}
                hideBalances={hideModalBalance}
            />
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
    </div >
        : <div style={{ textAlign: 'center' }}>

            <Avatar
                style={{
                    verticalAlign: 'middle',
                    margin: 4,
                    cursor: 'pointer',
                }}
                className="badge-avatar"
                src={<Spin />}
                size={size}
                onClick={() => setModalIsVisible(true)}
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