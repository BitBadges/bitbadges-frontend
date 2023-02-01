import { ReactNode, useEffect, useState } from "react";
import { BadgeMetadata, BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeAvatar } from "./BadgeAvatar";
import { getBadgeCollection } from "../../bitbadges-api/api";

export function BadgeAvatarDisplay({
    badgeCollection,
    setBadgeCollection,
    userBalance,
    startId,
    endId,
    size,
}: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badge: BitBadgeCollection) => void;
    userBalance: UserBalance | undefined;
    startId: number;
    endId: number;
    size?: number;
}) {
    //TODO: special ring around the badge if it is owned
    const individualBadgeMetadata = badgeCollection?.badgeMetadata;
    console.log(startId, endId);
    const [display, setDisplay] = useState<ReactNode>(<>
        {badgeCollection && endId - startId + 1 > 0
            && endId >= 0 &&
            startId >= 0
            && new Array(endId - startId + 1).fill(0).map((_, idx) => {
                console.log("together", idx + startId);
                return <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <BadgeAvatar
                        size={size}
                        badge={badgeCollection}
                        metadata={badgeCollection.badgeMetadata[idx + startId]}
                        badgeId={idx + startId}
                        balance={userBalance}
                    />
                </div>
            })
        }
    </>);


    let stringified = JSON.stringify(individualBadgeMetadata);
    useEffect(() => {
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            if (!badgeCollection || !setBadgeCollection) return;
            let numBadges = badgeCollection?.nextBadgeId;
            //TODO: should probably make it more scalable than this

            for (let i = 0; i < numBadges; i++) {
                if (individualBadgeMetadata && JSON.stringify(individualBadgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)) {
                    await getBadgeCollection(badgeCollection.collectionId, badgeCollection, i)
                        .then(res => { if (res.collection) setBadgeCollection(res.collection) });
                }

                setDisplay(<>
                    {
                        badgeCollection && endId - startId + 1 > 0
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
                                    metadata={badgeCollection.badgeMetadata[idx + startId]}
                                    badgeId={idx + startId}
                                    balance={userBalance}
                                />
                            </div>
                        })
                    }</>)
            }

        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata, setBadgeCollection, endId, startId, userBalance, size]);

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