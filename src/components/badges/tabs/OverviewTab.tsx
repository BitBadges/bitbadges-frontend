import { Row } from "antd";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard"
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";
import { BalanceOverview } from "../BalanceOverview";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";

export function OverviewTab({
    badgeCollection,
    userBalance
}: {
    badgeCollection: BitBadgeCollection | undefined;
    userBalance: UserBalance | undefined;
}) {
    if (!badgeCollection) return <></>;
    const collectionMetadata = badgeCollection?.collectionMetadata;

    return <>
        <InformationDisplayCard
            title="Badges"
        >
            <BadgeAvatarDisplay size={55} badgeCollection={badgeCollection} userBalance={userBalance} startId={0} endId={badgeCollection?.nextSubassetId - 1} />
        </InformationDisplayCard>
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
                metadata={collectionMetadata}
                balance={userBalance}
                span={7}
            />
        </Row>
    </>
}