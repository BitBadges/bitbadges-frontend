import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { BitBadgeCollection, IdRange, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatar } from "./BadgeAvatar";
import { useCollectionsContext } from "../../contexts/CollectionsContext";
import { getBadgeIdsToDisplayForPageNumber, getMetadataForBadgeId, updateMetadataForBadgeIdsIfAbsent } from "../../bitbadges-api/badges";
import { getPageDetails } from "../../utils/pagination";

export function BadgeAvatarDisplay({
    collection,
    userBalance,
    badgeIds,
    size,
    selectedId,
    showIds,
    pageSize = 10,
    showBalance,
    hideModalBalance
}: {
    collection: BitBadgeCollection | undefined;
    userBalance: UserBalance | undefined;
    badgeIds: IdRange[],
    size?: number;
    pageSize?: number;
    selectedId?: number;
    showIds?: boolean;
    showBalance?: boolean;
    hideModalBalance?: boolean;
}) {
    const collections = useCollectionsContext();

    const [currPage, setCurrPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

    //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
    const [currPageStart, setCurrPageStart] = useState<number>(0); // Index of first badge to display
    const [currPageEnd, setCurrPageEnd] = useState<number>(0); // Index of last badge to display
    const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<number[]>([]); // Badge IDs to display of length pageSize

    useEffect(() => {
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
    }, [currPage, pageSize, badgeIds]);

    useEffect(() => {
        if (!collection) return;

        //Calculate badge IDs to display and update metadata for badge IDs if absent
        const badgeIdsToDisplay: number[] = getBadgeIdsToDisplayForPageNumber(badgeIds, currPageStart, currPageEnd, pageSize);
        setBadgeIdsToDisplay(badgeIdsToDisplay);
        updateMetadataForBadgeIdsIfAbsent(badgeIdsToDisplay, collection, collections);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currPageStart, currPageEnd, collection]);

    if (!collection) return <></>;

    return <div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        }} >
            <Pagination
                style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                current={currPage}
                total={total}
                pageSize={pageSize}
                onChange={(page) => {
                    setCurrPage(page);
                }}
                hideOnSinglePage
                showSizeChanger={false}
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
                                    getMetadataForBadgeId(badgeIdsToDisplay[idx], collection.badgeMetadata)
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