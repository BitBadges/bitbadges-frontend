import { InfoCircleOutlined } from "@ant-design/icons";
import { faSnowflake, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row, Tooltip, Typography } from "antd";
import { AllAddressesTransferMapping, getIdRangesForAllBadgeIdsInCollection } from "../../bitbadges-api/badges";
import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BalanceOverview } from "./BalancesInfo";
import { CollectionOverview } from "./CollectionInfo";
import { PermissionsOverview } from "./PermissionsInfo";
import Markdown from 'react-markdown';

export function OverviewTab({
    collection,
    refreshUserBalance,
    userBalance,
    setTab,
    isPreview
}: {
    collection: BitBadgeCollection | undefined;
    refreshUserBalance: () => Promise<void>;
    userBalance: UserBalance | undefined;
    setTab: (tab: string) => void;
    isPreview?: boolean;
}) {
    if (!collection) return <></>;
    const collectionMetadata = collection?.collectionMetadata;

    const isTransferable = !collection.disallowedTransfers?.length;
    const isNonTransferable = collection.disallowedTransfers?.length === 1
        && JSON.stringify(collection.disallowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
        && JSON.stringify(collection.disallowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

    return <>
        <InformationDisplayCard
            title="Badges in Collection"
        >
            <BadgeAvatarDisplay
                showIds
                // size={55}
                collection={collection}
                userBalance={userBalance}
                badgeIds={getIdRangesForAllBadgeIdsInCollection(collection)}
                hideModalBalance={isPreview}
                maxWidth={'100%'}
            />
        </InformationDisplayCard>
        <br />
        {collection.collectionMetadata.description &&

            <InformationDisplayCard
                title="Description"
            >
                <div style={{ maxHeight: 400, overflow: 'auto' }} >
                    <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >
                        <Markdown>
                            {collection.collectionMetadata.description}
                        </Markdown>
                    </div>
                </div>
            </InformationDisplayCard>

        }
        <br />
        <Row
            style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            <Col span={11}>
                <CollectionOverview
                    collection={collection}
                    metadata={collectionMetadata}
                    isCollectionInfo
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
                            <Tooltip title="The transferability is frozen and can never be changed.">
                                <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faSnowflake} />
                            </Tooltip> :
                            <Tooltip title="Note that the manager can change the transferability.">
                                <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faUserPen} />

                            </Tooltip>
                        }

                    </>
                    }
                >
                    <div style={{ margin: 8 }}>
                        {
                            isTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Transferable</Typography.Text> : <>
                                {isNonTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Non-Transferable</Typography.Text>
                                    : <>                                        {
                                        collection.disallowedTransfers.map((transfer) => {
                                            return <>
                                                The addresses with account IDs {transfer.from.accountNums.map((range, index) => {
                                                    return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                })} {transfer.from.options === 1 ? '(including the manager)' : transfer.from.options === 2 ? '(excluding the manager)' : ''} cannot
                                                transfer to the addresses with account IDs {transfer.to.accountNums.map((range, index) => {
                                                    return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                })} {transfer.to.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''}.
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
                span={12}
                setTab={setTab}
                isPreview={isPreview}
            />
        </Row>
    </>
}