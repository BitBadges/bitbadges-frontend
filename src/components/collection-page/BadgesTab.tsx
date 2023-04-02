import { Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from 'bitbadges-sdk';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { BadgeCard } from '../badges/BadgeCard';
import { getBadgeIdsToDisplayForPageNumber, getMetadataForBadgeId, getIdRangesForAllBadgeIdsInCollection, updateMetadataForBadgeIdsFromIndexerIfAbsent } from 'bitbadges-sdk';
import { getPageDetails } from '../../utils/pagination';

export function BadgesTab({ collection, balance, badgeId, setBadgeId, isPreview, pageSize = 25 }: {
    collection: BitBadgeCollection;
    balance: UserBalance | undefined;
    badgeId: number;
    setBadgeId: (badgeId: number) => void;
    isPreview: boolean;
    pageSize?: number;
}) {
    const [currPage, setCurrPage] = useState<number>(1);
    const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<number[]>([]);
    const collections = useCollectionsContext();

    const modalToOpen = !isNaN(badgeId) ? badgeId : -1; //Handle if they try and link to exact badge (i.e. URL?id=1)

    const PAGE_SIZE = pageSize;
    const minId = 1;
    const maxId = collection?.nextBadgeId ? collection?.nextBadgeId - 1 : 1;

    const currPageDetails = getPageDetails(currPage, PAGE_SIZE, minId, maxId);
    const pageStartId = currPageDetails.start;
    const pageEndId = currPageDetails.end;


    useEffect(() => {

        //Calculate badge IDs to display and update metadata for badge IDs if absent
        const badgeIdsToDisplayResponse = getBadgeIdsToDisplayForPageNumber([
            {
                badgeIds: getIdRangesForAllBadgeIdsInCollection(collection),
                collection: collection
            }
        ], pageStartId - 1, pageSize);

        const badgeIdsToDisplay: number[] = [];
        for (const badgeIdObj of badgeIdsToDisplayResponse) {
            badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
        }
        setBadgeIdsToDisplay(badgeIdsToDisplay);

        const idxsToUpdate = updateMetadataForBadgeIdsFromIndexerIfAbsent(badgeIdsToDisplay, collection);
        if (idxsToUpdate.length > 0) {
            collections.updateCollectionMetadata(collection.collectionId, idxsToUpdate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageStartId, pageEndId, collection, currPage]);

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
                    total={Number(maxId) - Number(minId)}
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
                    && Number(pageEndId) - Number(pageStartId) + 1 > 0
                    && Number(pageEndId) >= 0
                    && Number(pageStartId) >= 0
                    && new Array(Number(pageEndId) - Number(pageStartId) + 1).fill(0).map((_, idx) => {
                        return <div key={idx}>
                            <BadgeCard
                                isModalOpen={modalToOpen === idx}
                                setBadgeId={setBadgeId}
                                balance={balance}
                                collection={collection}
                                metadata={
                                    getMetadataForBadgeId(badgeIdsToDisplay[idx], collection.badgeMetadata) || {} as BadgeMetadata
                                }
                                id={idx + Number(pageStartId)}
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
