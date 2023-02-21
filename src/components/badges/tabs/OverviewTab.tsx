import { InfoCircleOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Col, Row, Tooltip } from "antd";
import { AllAddressesTransferMapping, getFullBadgeIdRanges } from "../../../bitbadges-api/badges";
import { BitBadgeCollection, UserBalance } from "../../../bitbadges-api/types";
import { InformationDisplayCard } from "../../common/InformationDisplayCard";
import { BadgeAvatarDisplay } from "../../common/BadgeAvatarDisplay";
import { BalanceOverview } from "../BalanceOverview";
import { CollectionOverview } from "../CollectionOverview";
import { PermissionsOverview } from "../PermissionsOverview";

export function OverviewTab({
    collection,
    refreshUserBalance,
    userBalance,
    setTab
}: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => void;
    userBalance: UserBalance | undefined;
    setTab: (tab: string) => void;
}) {
    if (!collection) return <></>;
    const collectionMetadata = collection?.collectionMetadata;

    return <>
        <InformationDisplayCard
            title="Collection"
        >
            <BadgeAvatarDisplay
                showIds
                size={55}
                collection={collection}
                userBalance={userBalance}
                badgeIds={getFullBadgeIdRanges(collection)}
            />
        </InformationDisplayCard>
        <br />
        <br />
        <Row
            style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            <Col span={10}>
                <CollectionOverview
                    collection={collection}
                    metadata={collectionMetadata}
                    span={24}
                />
                <br />
                <InformationDisplayCard
                    title={<>
                        Transferability
                        <Tooltip title="Which badge owners can transfer to which badge owners?">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                        {!collection.permissions.CanUpdateDisallowed ?
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
                    {
                        //TODO: Refactor this
                    }
                    <div style={{ margin: 8 }}>
                        {
                            !collection.disallowedTransfers?.length ?
                                <>Badges in this collection are transferable.</> : <>
                                    {collection.disallowedTransfers.length === 1
                                        && JSON.stringify(collection.disallowedTransfers[0]) === JSON.stringify(AllAddressesTransferMapping) ?
                                        <>Badges in this collection are non-transferable and tied to an account.</>
                                        : <>                                        {
                                            collection.disallowedTransfers.map((transfer) => {
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
                <br />
                <PermissionsOverview
                    collection={collection}
                    span={24}
                />
            </Col>


            <BalanceOverview
                collection={collection}
                refreshUserBalance={refreshUserBalance}
                metadata={collectionMetadata}
                balance={userBalance}
                span={13}
                setTab={setTab}
            />
        </Row>
    </>
}