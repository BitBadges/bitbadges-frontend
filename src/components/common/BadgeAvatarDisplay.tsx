import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatar } from "./BadgeAvatar";

export function BadgeAvatarDisplay({
    collection,
    userBalance,
    startId,
    endId,
    size,
    selectedId,
    showIds,
    pageSize
}: {
    collection: BitBadgeCollection | undefined;
    userBalance: UserBalance | undefined;
    startId: number;
    endId: number;
    size?: number;
    pageSize?: number;
    selectedId?: number;
    showIds?: boolean;
}) {
    const [currPage, setCurrPage] = useState<number>(1);

    let stringifiedMetadata = JSON.stringify(collection?.badgeMetadata);
    useEffect(() => {

    }, [stringifiedMetadata]);

    if (!collection) return <></>;

    const PAGE_SIZE = pageSize ? pageSize : 50;
    const startIdNum = (currPage - 1) * PAGE_SIZE + startId;
    const endIdNum = endId < startIdNum + PAGE_SIZE - 1 ? endId : startIdNum + PAGE_SIZE - 1;

    console.log("Updated BadgeAvatarDisplay");



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
                total={Number(endId) - Number(startId)}
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
            maxHeight: 300,
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
                        }}>
                            <BadgeAvatar
                                size={size && selectedId === idx + Number(startIdNum) ? size * 1.4 : size}
                                collection={collection}
                                metadata={collection.badgeMetadata[idx + Number(startIdNum)]}
                                badgeId={idx + Number(startIdNum)}
                                balance={userBalance}
                                showId={showIds}
                            />
                        </div>
                    })
                }</>
        </div>
    </div>
}