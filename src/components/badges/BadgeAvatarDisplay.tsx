import { ReactNode, useEffect, useState } from "react";
import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeAvatar } from "./BadgeAvatar";

export function BadgeAvatarDisplay({
    badgeCollection,
    setBadgeCollection,
    userBalance,
    startId,
    endId,
    size,
    selectedId,
    hackyUpdatedFlag,
    showIds,
}: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: () => void;
    userBalance: UserBalance | undefined;
    startId: number;
    endId: number;
    size?: number;
    selectedId?: number;
    hackyUpdatedFlag?: boolean;
    showIds?: boolean;
}) {

    //TODO: special ring around the badge if it is owned
    const individualBadgeMetadata = badgeCollection?.badgeMetadata;

    console.log(Number(startId), Number(endId));

    const [display, setDisplay] = useState<ReactNode>(<>
        {badgeCollection && Number(endId) - Number(startId) + 1 > 0
            && Number(endId) >= 0 &&
            Number(startId) >= 0
            && new Array(Number(endId) - Number(startId) + 1).fill(0).map((_, idx) => {
                return <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <BadgeAvatar
                        size={size && selectedId === idx + Number(startId) ? size * 1.4 : size}
                        badge={badgeCollection}
                        metadata={badgeCollection.badgeMetadata[idx + Number(startId) - 1]}
                        badgeId={idx + Number(startId)}
                        balance={userBalance}
                        showId={showIds}
                    />
                </div>
            })
        }
    </>);


    let stringified = JSON.stringify(individualBadgeMetadata);
    useEffect(() => {
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            if (!badgeCollection || !setBadgeCollection) return;

            setDisplay(<>
                {
                    badgeCollection && Number(endId) - Number(startId) + 1 > 0
                    && Number(endId) >= 0 &&
                    Number(startId) >= 0
                    && new Array(Number(endId) - Number(startId) + 1).fill(0).map((_, idx) => {
                        return <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <BadgeAvatar
                                size={size && selectedId === idx + Number(startId) ? size * 1.4 : size}
                                badge={badgeCollection}
                                metadata={badgeCollection.badgeMetadata[idx + Number(startId) - 1]}
                                badgeId={idx + Number(startId)}
                                balance={userBalance}
                                showId={showIds}
                            />
                        </div>
                    })
                }</>)

        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata, badgeCollection?.badgeMetadata, setBadgeCollection, endId, startId, userBalance, size, selectedId, hackyUpdatedFlag, showIds]);

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
        {display}
    </div>
}