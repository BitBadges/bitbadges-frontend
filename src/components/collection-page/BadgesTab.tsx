import { Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { BadgeCard } from '../badges/BadgeCard';

export function BadgesTab({ collection, balance, badgeId, setBadgeId, isPreview }: {
    collection: BitBadgeCollection;
    balance: UserBalance | undefined;
    badgeId: number;
    setBadgeId: (badgeId: number) => void;
    isPreview: boolean;
}) {
    const [currPage, setCurrPage] = useState<number>(1);
    const collections = useCollectionsContext();

    const modalToOpen = !isNaN(badgeId) ? badgeId : -1; //Handle if they try and link to exact badge (i.e.?id=1)

    const PAGE_SIZE = 25;
    const startId = 1;
    const endId = collection?.nextBadgeId ? collection?.nextBadgeId - 1 : 1;
    const startIdNum = (currPage - 1) * PAGE_SIZE + startId;
    const endIdNum = endId < startIdNum + PAGE_SIZE - 1 ? endId : startIdNum + PAGE_SIZE - 1;

    useEffect(() => {
        for (let i = startIdNum; i <= endIdNum; i++) {
            if (!collection?.badgeMetadata[i]) {
                collections.updateCollectionMetadata(collection.collectionId, i);
                break;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIdNum, endIdNum]);

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
                    collection
                    && Number(endIdNum) - Number(startIdNum) + 1 > 0
                    && Number(endIdNum) >= 0
                    && Number(startIdNum) >= 0
                    && new Array(Number(endIdNum) - Number(startIdNum) + 1).fill(0).map((_, idx) => {
                        return <div key={idx}>
                            <BadgeCard
                                isModalOpen={modalToOpen === idx}
                                setBadgeId={setBadgeId}
                                balance={balance}
                                collection={collection}
                                metadata={collection.badgeMetadata[idx + Number(startIdNum)]}
                                id={idx + Number(startIdNum)}
                                hideModalBalances={isPreview}
                            />
                        </div>
                    })}
            </div>

            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(collection, null, 2)}
                </pre>
            }
        </div >
    );
}
