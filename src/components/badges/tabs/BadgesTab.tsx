import { Pagination } from 'antd';
import { BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { BadgeCard } from '../BadgeCard';
import { useState } from 'react';

export function BadgesTab({ badgeCollection, setBadgeCollection, balance, badgeId, setBadgeId }: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badgeCollection: BitBadgeCollection) => void;
    balance: UserBalance | undefined;
    badgeId: number;
    setBadgeId: (badgeId: number) => void;
}) {
    const [currPage, setCurrPage] = useState<number>(1);

    const modalToOpen = !isNaN(badgeId) ? badgeId : -1;

    const individualBadgeMetadata = badgeCollection?.badgeMetadata;

    const startId = 1;
    const endId = badgeCollection?.nextBadgeId ? badgeCollection?.nextBadgeId - 1 : 1;

    const PAGE_SIZE = 25;
    const startIdNum = (currPage - 1) * PAGE_SIZE + startId;
    const endIdNum = endId < startIdNum + PAGE_SIZE - 1 ? endId : startIdNum + PAGE_SIZE - 1;

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }} >
                <Pagination
                    style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                    current={currPage}
                    total={Number(endId) - Number(startId)}
                    pageSize={PAGE_SIZE}
                    onChange={(page) => {
                        setCurrPage(page);
                    }}
                    hideOnSinglePage
                    showSizeChanger={false}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {
                    badgeCollection && Number(endIdNum) - Number(startIdNum) + 1 > 0
                    && Number(endIdNum) >= 0 &&
                    Number(startIdNum) >= 0
                    && new Array(Number(endIdNum) - Number(startIdNum) + 1).fill(0).map((_, idx) => {
                        return <div key={idx}>
                            <BadgeCard
                                isModalOpen={modalToOpen === idx}
                                setBadgeId={setBadgeId}
                                balance={balance}
                                collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                                metadata={badgeCollection.badgeMetadata[idx + Number(startIdNum) - 1]}
                                id={idx + Number(startIdNum)}
                            />
                        </div>
                    })}
            </div>


            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badgeCollection, null, 2)}
                </pre>
            }
        </div >
    );
}
