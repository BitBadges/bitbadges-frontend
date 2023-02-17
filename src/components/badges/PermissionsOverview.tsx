import { Divider, Empty, Tooltip, Typography } from "antd"
import { PRIMARY_TEXT } from "../../constants";
import { BitBadgeCollection } from "../../bitbadges-api/types";
import { TableRow } from "../common/TableRow";
import { InformationDisplayCard } from "../common/InformationDisplayCard";
import { TransferDisplay } from "../common/TransferDisplay";
import { InfoCircleOutlined, InfoOutlined } from "@ant-design/icons";

export function PermissionsOverview({
    badgeCollection,
    span
}: {
    badgeCollection: BitBadgeCollection
    span?: number
}) {
    if (!badgeCollection?.permissions) return <></>

    return <InformationDisplayCard title={'Manager Permissions'} span={span}>
        <>
            {!badgeCollection.permissions.CanUpdateDisallowed &&
                // !badgeCollection.freezeRanges?.length && TODO:
                !badgeCollection.permissions.CanCreateMoreBadges &&
                !badgeCollection.permissions.CanUpdateUris &&
                !badgeCollection.permissions.CanUpdateBytes &&
                // !badgeCollection.permissions.CanRevoke &&
                !badgeCollection.permissions.CanManagerBeTransferred ?
                <Typography.Text strong style={{ color: PRIMARY_TEXT, padding: 10 }}>
                    This collection is completely frozen!
                    Badges cannot be created, transferred, updated, or revoked!
                </Typography.Text> :
                <>
                    {/* //TODO: update bytes */}

                    {<TableRow label={"Can badges be added to the collection?"} value={badgeCollection.permissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Can the manager role be transferred?"} value={badgeCollection.permissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Can the manager edit the metadata URLs?"} value={badgeCollection.permissions.CanUpdateUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} /> //TODO: explain this does not mean the metadata can be updated; only the URL updates
                    }
                    {<TableRow label={"Can the manager edit the forbidden transfers?"} value={badgeCollection.permissions.CanUpdateDisallowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}


                    <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                    <h3>{"Manager's Approved Transfers"}
                        <Tooltip title="The manager is always approved to execute the following transfers without the owner's permission.">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                    </h3>
                    {
                        !badgeCollection.managerApprovedTransfers?.length ?
                            <Empty
                                description={'The manager has no approved transfers.'}
                                style={{ color: PRIMARY_TEXT }}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            /> : <>
                                {badgeCollection.managerApprovedTransfers.map((transfer, index) => {
                                    return <>
                                        The manager can forcefully transfer badges from account IDs {transfer.to.accountNums.map((range, index) => {
                                            return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                        })} to account IDs {transfer.from.accountNums.map((range, index) => {
                                            return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                        })}.
                                        <br />
                                    </>
                                })}
                            </>
                    }
                    <br />
                </>


            }
        </>
    </InformationDisplayCard>
}