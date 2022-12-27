import React, { ReactNode, useEffect, useState } from 'react';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata, BitBadgeCollection } from '../../../bitbadges-api/types';
import { BadgeCard } from '../../BadgeCard';
import { getBadge } from '../../../bitbadges-api/api';

export function BadgeSubBadgesTab({ badgeCollection, setBadgeCollection }: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badgeCollection: BitBadgeCollection) => void;
}) {
    const individualBadgeMetadata = badgeCollection?.badgeMetadata;
    const [display, setDisplay] = useState<ReactNode>(<>
        {individualBadgeMetadata?.map((metadata, idx) => {
            return <div key={idx}>
                <BadgeCard collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection} metadata={metadata} id={idx} />
            </div>
        })}
    </>);

    let stringified = JSON.stringify(individualBadgeMetadata);

    useEffect(() => {
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            if (!badgeCollection) return;
            let numBadges = badgeCollection?.nextSubassetId;
            //TODO: should probably make it more scalable than this

            for (let i = 0; i < numBadges; i++) {
                if (individualBadgeMetadata && JSON.stringify(individualBadgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)) {
                    await getBadge(badgeCollection.id, badgeCollection, i)
                        .then(res => { if (res.badge) setBadgeCollection(res.badge) });
                }
            }

            setDisplay(<>
                {individualBadgeMetadata?.map((metadata, idx) => {
                    return <div key={idx}>
                        <BadgeCard collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection} metadata={metadata} id={idx} />
                    </div>
                })}
            </>)
        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata, setBadgeCollection]);

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
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
