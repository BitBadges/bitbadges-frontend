import { Col, Empty, Row, Tooltip } from "antd";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { BalanceOverview } from "../BalanceOverview";
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";
import { PRIMARY_TEXT } from "../../../constants";
import { InfoCircleOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { AllAddressesTransferMapping } from "../../../bitbadges-api/badges";

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
            <BadgeAvatarDisplay showIds size={55} setBadgeCollection={setBadgeCollection} badgeCollection={badgeCollection} userBalance={userBalance} startId={1} endId={badgeCollection?.nextBadgeId - 1} />
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
                        Transferability
                        <Tooltip title="Which badge owners can transfer to which badge owners?">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                        {!badgeCollection.permissions.CanUpdateDisallowed ?
                            <Tooltip title="The transferability is locked and can never be changed.">
                                <LockOutlined style={{ marginLeft: 4 }} />
                            </Tooltip> :
                            <Tooltip title="Note that the manager can change the transferability.">
                                <UnlockOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        }

                    </>
                    }
                >
                    <div style={{ margin: 8 }}>
                        {
                            !badgeCollection.disallowedTransfers?.length ?
                                <>Badges in this collection are transferable.</> : <>
                                    {badgeCollection.disallowedTransfers.length === 1
                                        && JSON.stringify(badgeCollection.disallowedTransfers[0]) === JSON.stringify(AllAddressesTransferMapping) ?
                                        <>Badges in this collection are non-transferable and tied to an account.</>
                                        : <>                                        {
                                            badgeCollection.disallowedTransfers.map((transfer, index) => {
                                                return <>
                                                    The addresses with account IDs {transfer.to.accountNums.map((range, index) => {
                                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                    })} {transfer.to.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''} cannot
                                                    transfer to the addresses with account IDs {transfer.from.accountNums.map((range, index) => {
                                                        return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                    })} {transfer.from.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''}.
                                                    <br />
                                                </>
                                            })

                                        }
                                        </>
                                    }
                                </>
                        }
                    </div>
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