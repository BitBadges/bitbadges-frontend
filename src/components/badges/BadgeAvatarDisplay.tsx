import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeAvatar } from "./BadgeAvatar";

export function BadgeAvatarDisplay({
    badgeCollection,
    userBalance,
    startId,
    endId,
    size
}: {
    badgeCollection: BitBadgeCollection | undefined;
    userBalance: UserBalance | undefined;
    startId: number;
    endId: number;
    size?: number;
}) {
    if (!badgeCollection) return <></>;

    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxHeight: 300,
        overflow: 'auto',
    }} >
        {badgeCollection && endId - startId + 1 > 0
            && endId >= 0 &&
            startId >= 0
            && new Array(endId - startId + 1).fill(0).map((_, idx) => {
                return <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <BadgeAvatar
                        size={size}
                        badge={badgeCollection}
                        metadata={badgeCollection.badgeMetadata[idx]}
                        badgeId={idx}
                        balance={userBalance}
                    />
                </div>
            })
        }
    </div>
}