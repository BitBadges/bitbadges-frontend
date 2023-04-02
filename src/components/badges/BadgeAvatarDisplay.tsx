import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { BadgeAvatar } from "./BadgeAvatar";
import { useCollectionsContext } from "../../contexts/CollectionsContext";
import { getBadgeIdsToDisplayForPageNumber, getMetadataForBadgeId, updateMetadataForBadgeIdsFromIndexerIfAbsent } from "bitbadges-sdk";
import { getPageDetails } from "../../utils/pagination";
import { BitBadgeCollection, UserBalance, IdRange, BadgeMetadata } from "bitbadges-sdk";
import { PRIMARY_TEXT, PRIMARY_BLUE } from "../../constants";

export function BadgeAvatarDisplay({
    collection,
    userBalance,
    badgeIds,
    size,
    selectedId,
    showIds,
    pageSize = 10,
    showBalance,
    hideModalBalance,
    maxWidth = 350,
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent,
}: {
    collection: BitBadgeCollection | undefined;
    userBalance?: UserBalance;
    badgeIds: IdRange[],
    size?: number;
    pageSize?: number;
    selectedId?: number;
    showIds?: boolean;
    showBalance?: boolean;
    hideModalBalance?: boolean;
    maxWidth?: number | string;
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void;
}) {
    const collections = useCollectionsContext();

    const [currPage, setCurrPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

    //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
    const [currPageStart, setCurrPageStart] = useState<number>(0); // Index of first badge to display
    const [currPageEnd, setCurrPageEnd] = useState<number>(0); // Index of last badge to display
    const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<number[]>([]); // Badge IDs to display of length pageSize

    useEffect(() => {
        if (!collection) return;
        
        console.log("TEST");
        let total = 0;
        for (const range of badgeIds) {
            const numBadgesInRange = Number(range.end) - Number(range.start) + 1;
            total += numBadgesInRange;
        }
        setTotal(total);

        const currPageDetails = getPageDetails(currPage, pageSize, 0, total - 1);
        const currPageStart = currPageDetails.start;
        const currPageEnd = currPageDetails.end;

        setCurrPageStart(currPageStart);
        setCurrPageEnd(currPageEnd);



        //Calculate badge IDs to display and update metadata for badge IDs if absent
        const badgeIdsToDisplayResponse = getBadgeIdsToDisplayForPageNumber([
            {
                badgeIds: badgeIds,
                collection: collection
            }
        ], currPageStart, pageSize);
        
        const badgeIdsToDisplay: number[] = [];
        for (const badgeIdObj of badgeIdsToDisplayResponse) {
            badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
        }


        setBadgeIdsToDisplay(badgeIdsToDisplay);

        //If updateMetadataForBadgeIdsDirectlyFromUriIfAbsent is true, then update metadata by directly fetching from URI (only used when providing self-hosted metadata URIs in TxTimeline)
        //Else, we simply query our indexer
        if (updateMetadataForBadgeIdsDirectlyFromUriIfAbsent) {
            updateMetadataForBadgeIdsDirectlyFromUriIfAbsent(badgeIdsToDisplay);
        } else {
            if (!collection) return;
            const idxsToUpdate = updateMetadataForBadgeIdsFromIndexerIfAbsent(badgeIdsToDisplay, collection);
            if (idxsToUpdate.length > 0) {
                collections.updateCollectionMetadata(collection.collectionId, idxsToUpdate);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currPage, pageSize, badgeIds]);

    if (!collection) return <></>;

    return <div style={{ maxWidth: maxWidth }}>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        }} >
            <Pagination
                style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT, fontSize: 14 }}
                current={currPage}
                total={total}
                pageSize={pageSize}

                onChange={(page) => {
                    setCurrPage(page);
                }}
                showLessItems
                showSizeChanger={false}
                size='small'
            />
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            overflow: 'auto',
        }} >
            <>
                <br />
                {
                    Number(currPageEnd) - Number(currPageStart) + 1 > 0
                    && Number(currPageEnd) >= 0 &&
                    Number(currPageStart) >= 0
                    && new Array(Number(currPageEnd) - Number(currPageStart) + 1).fill(0).map((_, idx) => {
                        return <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: 2
                        }}>
                            <BadgeAvatar
                                size={size && selectedId === badgeIdsToDisplay[idx] ? size * 1.5 : size}
                                collection={collection}
                                metadata={
                                    getMetadataForBadgeId(badgeIdsToDisplay[idx], collection.badgeMetadata) || {} as BadgeMetadata
                                }
                                badgeId={badgeIdsToDisplay[idx]}
                                balance={userBalance}
                                showId={showIds}
                                showBalance={showBalance}
                                hideModalBalance={hideModalBalance}
                            />
                        </div>
                    })
                }</>
        </div>
    </div>
}