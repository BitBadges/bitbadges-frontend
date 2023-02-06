import { Row } from "antd";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard"
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";
import { BalanceOverview } from "../BalanceOverview";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { DEV_MODE } from "../../../constants";
import { ClaimDisplay } from "../../common/ClaimDisplay";
import { useEffect, useState } from "react";
import { CreateTxMsgClaimBadgeModal } from "../../txModals/CreateTxMsgClaimBadge";
import MerkleTree from "merkletreejs";
import { SHA256 } from "crypto-js";

export function OverviewTab({
    badgeCollection,
    setBadgeCollection,
    userBalance,
    setTab,
}: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badge: BitBadgeCollection) => void;
    userBalance: UserBalance | undefined;
    setTab: (tab: string) => void;
}) {





    if (!badgeCollection) return <></>;
    const collectionMetadata = badgeCollection?.collectionMetadata;




    return <>
        <InformationDisplayCard
            title="Collection"
        >
            <BadgeAvatarDisplay size={55} setBadgeCollection={setBadgeCollection} badgeCollection={badgeCollection} userBalance={userBalance} startId={0} endId={badgeCollection?.nextBadgeId - 1} />
        </InformationDisplayCard>
        <br />
        {/* <InformationDisplayCard
            title="Claims"
        >


            

            <CreateTxMsgClaimBadgeModal
                badge={badgeCollection}
                setBadgeCollection={setBadgeCollection}
                claimId={claimId}
                balance={getBlankBalance()}
                visible={modalVisible}
                setVisible={setModalVisible}
                merkleTree={merkleTrees[claimId]}
            />
        </InformationDisplayCard> */}
        <br />
        <Row
            style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            <CollectionOverview
                badge={badgeCollection}
                metadata={collectionMetadata}
                span={7}
            />
            <PermissionsOverview
                badgeCollection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                span={7}
            />
            <BalanceOverview
                badge={badgeCollection}
                setBadge={setBadgeCollection}
                metadata={collectionMetadata}
                balance={userBalance}
                span={7}
                setTab={setTab}
            />
        </Row>
    </>
}