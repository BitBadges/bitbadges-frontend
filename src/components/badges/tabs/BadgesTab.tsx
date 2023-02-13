import React, { ReactNode, useEffect, useState } from 'react';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { BadgeCard } from '../BadgeCard';
import { getBadgeCollection } from '../../../bitbadges-api/api';

export function BadgesTab({ badgeCollection, setBadgeCollection, balance, badgeId, setBadgeId }: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badgeCollection: BitBadgeCollection) => void;
    balance: UserBalance | undefined;
    badgeId: number;
    setBadgeId: (badgeId: number) => void;
}) {
    const modalToOpen = !isNaN(badgeId) ? badgeId : -1;

    const individualBadgeMetadata = badgeCollection?.badgeMetadata;
    const [display, setDisplay] = useState<ReactNode>(<>
        {individualBadgeMetadata?.map((metadata, idx) => {
            return <div key={idx}>
                <BadgeCard isModalOpen={modalToOpen === idx}
                setBadgeId collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection} metadata={metadata} id={idx} />
            </div>
        })}
    </>);

    let stringified = JSON.stringify(individualBadgeMetadata);

    useEffect(() => {
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            if (!badgeCollection) return;
            let numBadges = badgeCollection?.nextBadgeId;
            //TODO: should probably make it more scalable than this

            for (let i = 0; i < numBadges; i++) {
                if (individualBadgeMetadata && JSON.stringify(individualBadgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)) {
                    await getBadgeCollection(badgeCollection.collectionId, badgeCollection, i)
                        .then(res => { if (res.collection) setBadgeCollection(res.collection) });
                }
            }

            setDisplay(<>
                {individualBadgeMetadata?.map((metadata, idx) => {
                    return <div key={idx}>
                        <BadgeCard
                            isModalOpen={modalToOpen === idx}
                            setBadgeId={setBadgeId}
                            balance={balance}
                            collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                            metadata={metadata}
                            id={idx}
                        />
                    </div>
                })}
            </>)
        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata, setBadgeCollection, balance, modalToOpen]);

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            {/* <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                Badges
            </Text>
            <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider> */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {display}
            </div>


            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badgeCollection, null, 2)}
                </pre>
            }
        </div >
    );
}
