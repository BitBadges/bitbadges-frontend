import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { BitBadgeCollection, IdRange, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatar } from "./BadgeAvatar";
import { useCollectionsContext } from "../../contexts/CollectionsContext";
import { getMetadataForBadgeId } from "../../bitbadges-api/badges";

export function BadgeAvatarDisplay({
    collection,
    userBalance,
    badgeIds,
    size,
    selectedId,
    showIds,
    pageSize,
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
    const [currPage, setCurrPage] = useState<number>(1);
    const collections = useCollectionsContext();



    const PAGE_SIZE = pageSize ? pageSize : 10;
    let total = 0;
    let ids: number[] = [];
    for (const range of badgeIds) {
        total += Number(range.end) - Number(range.start) + 1;
        for (let i = Number(range.start); i <= Number(range.end); i++) {
            ids.push(i);
        }
    }
    ids.sort((a, b) => a - b);


    const endIdx = ids.length - 1;

    const startIdNum = (currPage - 1) * PAGE_SIZE;
    const endIdNum = endIdx < startIdNum + PAGE_SIZE - 1 ? endIdx : startIdNum + PAGE_SIZE - 1;


    useEffect(() => {
        if (!collection) return;
        for (let i = startIdNum; i <= endIdNum; i++) {
            if (!getMetadataForBadgeId(ids[i], collection.badgeMetadata)) {
                let idx = 0;
                for (const badgeUri of collection.badgeUris) {
                    for (const badgeIdRange of badgeUri.badgeIds) {
                        if (Number(badgeIdRange.start) <= ids[i] && Number(badgeIdRange.end) >= ids[i]) {
                            collections.updateCollectionMetadata(collection.collectionId, idx);
                            break;
                        }
                    }
                    idx++;
                }
                break;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIdNum, endIdNum]);

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
                pageSize={PAGE_SIZE}
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
                    collection
                    && Number(endIdNum) - Number(startIdNum) + 1 > 0
                    && Number(endIdNum) >= 0 &&
                    Number(startIdNum) >= 0
                    && new Array(Number(endIdNum) - Number(startIdNum) + 1).fill(0).map((_, idx) => {
                        return <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: 2
                        }}>
                            <BadgeAvatar
                                size={size && selectedId === ids[idx + Number(startIdNum)] ? size * 1.5 : size}
                                collection={collection}
                                metadata={
                                    getMetadataForBadgeId(ids[idx + Number(startIdNum)], collection.badgeMetadata)
                                }
                                badgeId={ids[idx + Number(startIdNum)]}
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