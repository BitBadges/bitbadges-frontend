import { Col, Row } from "antd";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { BalanceOverview } from "../BalanceOverview";
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";

export function OverviewTab({
    badgeCollection,
    setBadgeCollection,
    setUserBalance,
    userBalance,
    setTab,
}: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: () => void;
    setUserBalance: () => void;
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
            <Col span={10}>
                <CollectionOverview
                    badge={badgeCollection}
                    metadata={collectionMetadata}
                    span={24}
                />
                <br />
                <PermissionsOverview
                    badgeCollection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                    span={24}
                />
            </Col>


            <BalanceOverview
                badge={badgeCollection}
                setBadge={setBadgeCollection}
                setUserBalance={setUserBalance}
                metadata={collectionMetadata}
                balance={userBalance}
                span={13}
                setTab={setTab}
            />
        </Row>
    </>
}