import { Avatar, Modal, Pagination, Tooltip } from "antd";
import { BadgeMetadata, BitBadgeCollection, BitBadgesUserInfo, IdRange, getBadgeIdsToDisplayForPageNumber, getIdRangesForAllBadgeIdsInCollection, getMetadataForBadgeId, updateMetadataForBadgeIdsFromIndexerIfAbsent } from "bitbadges-sdk";
import { useEffect, useState } from "react";
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useCollectionsContext } from "../../contexts/CollectionsContext";
import { getPageDetails } from "../../utils/pagination";
import { BadgeCard } from "./BadgeCard";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { useRouter } from "next/router";
import { useChainContext } from "../../contexts/ChainContext";

export function MultiCollectionBadgeDisplay({
    collections,
    accountInfo,

    cardView,
    pageSize = 25,
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent,
    groupByCollection,
    hideCollectionLink
}: {
    collections: BitBadgeCollection[], accountInfo?: BitBadgesUserInfo, cardView?: boolean, pageSize?: number,
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void;
    groupByCollection?: boolean;
    hideCollectionLink?: boolean;
}) {

    const collectionsContext = useCollectionsContext();
    const router = useRouter();
    const chain = useChainContext();
    const [currPage, setCurrPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

    //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
    const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<{
        collection: BitBadgeCollection,
        badgeIds: number[]
    }[]>([]); // Badge IDs to display of length pageSize


    useEffect(() => {
        if (groupByCollection) {
            return;
        }

        //Calculate badge IDs for each collection
        const allBadgeIds: {
            collection: BitBadgeCollection,
            badgeIds: IdRange[]
        }[] = [];
        for (const collection of collections) {
            if (accountInfo) {

                allBadgeIds.push({
                    badgeIds: collection.balances[accountInfo?.accountNumber || 0]?.balances.map(balance => balance.badgeIds).flat() || [],
                    collection
                });
            } else {
                allBadgeIds.push({
                    badgeIds: getIdRangesForAllBadgeIdsInCollection(collection),
                    collection
                });
            }
        }


        //Calculate total number of badge IDs
        let total = 0;
        for (const obj of allBadgeIds) {
            for (const range of obj.badgeIds) {
                const numBadgesInRange = Number(range.end) - Number(range.start) + 1;
                total += numBadgesInRange;
            }
        }
        setTotal(total);

        const currPageDetails = getPageDetails(currPage, pageSize, 0, total - 1);
        const currPageStart = currPageDetails.start;

        //Calculate badge IDs to display and update metadata for badge IDs if absent
        const badgeIdsToDisplay: {
            collection: BitBadgeCollection,
            badgeIds: number[]
        }[] = getBadgeIdsToDisplayForPageNumber(allBadgeIds, currPageStart, pageSize);
        setBadgeIdsToDisplay(badgeIdsToDisplay);

        for (const badgeIdObj of badgeIdsToDisplay) {
            //If updateMetadataForBadgeIdsDirectlyFromUriIfAbsent is true, then update metadata by directly fetching from URI (only used when providing self-hosted metadata URIs in TxTimeline)
            //Else, we simply query our indexer
            if (updateMetadataForBadgeIdsDirectlyFromUriIfAbsent) {
                updateMetadataForBadgeIdsDirectlyFromUriIfAbsent(badgeIdObj.badgeIds);
            } else {
                const idxsToUpdate = updateMetadataForBadgeIdsFromIndexerIfAbsent(badgeIdObj.badgeIds, badgeIdObj.collection);
                if (idxsToUpdate.length > 0) {
                    collectionsContext.updateCollectionMetadata(badgeIdObj.collection.collectionId, idxsToUpdate);
                }
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currPage, pageSize, collections]);

    if (!collections) return <></>;

    if (groupByCollection) {
        return <>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }} >
                <Pagination
                    style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                    current={currPage}
                    total={collections.length}
                    pageSize={pageSize}
                    onChange={(page) => {
                        setCurrPage(page);
                    }}
                    hideOnSinglePage
                    showSizeChanger={false}
                />
            </div>


            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
                {
                    collections.map((collection, idx) => {
                        return <div key={idx} style={{ width: 350, margin: 10, display: 'flex' }}>
                            <InformationDisplayCard
                                noBorder
                                title={<>
                                    <Tooltip color='black' title={"Collection ID: " + collection.collectionId} placement="bottom">
                                        <div className='link-button-nav' onClick={() => {
                                            router.push('/collections/' + collection.collectionId)
                                            Modal.destroyAll()
                                        }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Avatar
                                                src={collection.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                                size={40}
                                                style={{
                                                    verticalAlign: 'middle',
                                                    border: '1px solid',
                                                    borderColor: collection.collectionMetadata?.color
                                                        ? collection.collectionMetadata?.color
                                                        : 'black',
                                                    margin: 4,
                                                }}
                                            /> {collection.collectionMetadata?.name}

                                        </div>
                                    </Tooltip>
                                </>}
                            >
                                <BadgeAvatarDisplay
                                    collection={collection}
                                    pageSize={cardView ? 1 : 10}
                                    cardView={cardView}
                                    userBalance={collection.balances[chain.accountNumber || 0]}
                                    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
                                    badgeIds={collection.balances[accountInfo?.accountNumber || 0]?.balances.map(balance => balance.badgeIds).flat() || []}
                                    hideCollectionLink={hideCollectionLink}
                                />
                            </InformationDisplayCard>
                        </div>




                    })
                }
            </div>
        </>

    } else {

        return <>
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
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                {
                    badgeIdsToDisplay.map((badgeIdObj) => {
                        return <>
                            {badgeIdObj.badgeIds.map((badgeId, idx) => {
                                return <div key={idx} style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    {cardView ?
                                        <BadgeCard
                                            collection={badgeIdObj.collection}
                                            metadata={
                                                getMetadataForBadgeId(badgeId, badgeIdObj.collection.badgeMetadata) || {} as BadgeMetadata
                                            }
                                            id={badgeId}
                                            hideCollectionLink={hideCollectionLink}
                                        /> :
                                        <BadgeAvatar
                                            size={70}
                                            collection={badgeIdObj.collection}
                                            metadata={
                                                getMetadataForBadgeId(badgeId, badgeIdObj.collection.badgeMetadata) || {} as BadgeMetadata
                                            }
                                            badgeId={badgeId}
                                            balance={badgeIdObj.collection.balances[accountInfo?.accountNumber || 0]}
                                        />
                                    }
                                </div>
                            })}
                        </>
                    })
                }
            </div>
        </>
    }
}