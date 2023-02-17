import { Col, Empty, Row, Tooltip } from "antd";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { BalanceOverview } from "../BalanceOverview";
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";
import { PRIMARY_TEXT } from "../../../constants";
import { InfoCircleOutlined } from "@ant-design/icons";

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
            <BadgeAvatarDisplay showIds size={55} setBadgeCollection={setBadgeCollection} badgeCollection={badgeCollection} userBalance={userBalance} startId={0} endId={badgeCollection?.nextBadgeId - 1} />
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
                <br />
                <InformationDisplayCard
                    title={<>
                        Forbidden Transfers
                        <Tooltip title="The manager has set the following transfer combinations to be forbidden.">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip></>
                    }
                >
                    {!badgeCollection.disallowedTransfers?.length ?
                        <Empty
                            description={'All transfers are allowed.'}
                            style={{ color: PRIMARY_TEXT }}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        /> : <>
                            {badgeCollection.disallowedTransfers.map((transfer, index) => {
                                return <>
                                    The addresses with account IDs {transfer.to.accountNums.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                    })} {transfer.to.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''} cannot
                                    transfer to the addresses with account IDs {transfer.from.accountNums.map((range, index) => {
                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                    })} {transfer.from.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''}.
                                    <br />
                                </>
                            })}
                        </>}
                </InformationDisplayCard>
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