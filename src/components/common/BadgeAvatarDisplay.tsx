import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { BitBadgeCollection, IdRange, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatar } from "./BadgeAvatar";
import { useCollectionsContext } from "../../collections/CollectionsContext";

export function BadgeAvatarDisplay({
    collection,
    userBalance,
    badgeIds,
    size,
    selectedId,
    showIds,
    pageSize,
    showBalance,
    prefixMessage,
}: {
    collection: BitBadgeCollection | undefined;
    userBalance: UserBalance | undefined;
    badgeIds: IdRange[],
    size?: number;
    pageSize?: number;
    selectedId?: number;
    showIds?: boolean;
    showBalance?: boolean;
    prefixMessage?: string;
}) {
    const [currPage, setCurrPage] = useState<number>(1);
    const collections = useCollectionsContext();

    if (!collection) return <></>;

    const PAGE_SIZE = pageSize ? pageSize : 50;
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




    for (let i = startIdNum; i <= endIdNum; i++) {
        if (!collection?.badgeMetadata[ids[i]]) {
            collections.updateCollectionMetadata(collection.collectionId, ids[i]);
            break;
        }
    }


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
                                size={size && selectedId === ids[idx + Number(startIdNum)] ? size * 1.4 : size}
                                collection={collection}
                                metadata={collection.badgeMetadata[ids[idx + Number(startIdNum)]]}
                                badgeId={ids[idx + Number(startIdNum)]}
                                balance={userBalance}
                                showId={showIds}
                                showBalance={showBalance}
                            />
                        </div>
                    })
                }</>
        </div>
    </div>
}