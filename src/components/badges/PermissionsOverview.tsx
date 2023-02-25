import { InfoCircleOutlined } from "@ant-design/icons";
import { Divider, Tooltip, Typography } from "antd";
import { AllAddressesTransferMapping } from "../../bitbadges-api/badges";
import { BitBadgeCollection } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { InformationDisplayCard } from "../common/InformationDisplayCard";
import { TableRow } from "../common/TableRow";

export function PermissionsOverview({
    collection,
    span
}: {
    collection: BitBadgeCollection
    span?: number
}) {
    if (!collection?.permissions) return <></>

    return <InformationDisplayCard title={'Manager Permissions'} span={span}>
        <>
            {!collection.permissions.CanUpdateDisallowed &&
                !collection.permissions.CanCreateMoreBadges &&
                !collection.permissions.CanUpdateUris &&
                !collection.permissions.CanUpdateBytes &&
                !collection.permissions.CanManagerBeTransferred ?
                <Typography.Text strong style={{ color: PRIMARY_TEXT, padding: 10 }}>
                    This collection is completely frozen!
                    Badges cannot be created, transferred, updated, or revoked!
                </Typography.Text> :
                <>
                    {<TableRow label={"Add badges to the collection?"} value={collection.permissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Transfer the role of manager?"} value={collection.permissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Edit metadata URLs?"} value={collection.permissions.CanUpdateUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Edit transferability?"} value={collection.permissions.CanUpdateDisallowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}

                    <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                    <h3 style={{ color: PRIMARY_TEXT }}>{"Manager's Approved Transfers"}
                        <Tooltip title="The manager's approved transfers are those that they can execute without needing the owner's permission. These transfers forcefully override any other transfer restrictions (e.g. non-transferable).">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                    </h3>
                    <div style={{ margin: 4, color: PRIMARY_TEXT }}>
                        {
                            !collection.managerApprovedTransfers?.length ?
                                <Typography.Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>None</Typography.Text>
                                : <>
                                    {collection.managerApprovedTransfers.length === 1
                                        && JSON.stringify(collection.managerApprovedTransfers[0]) === JSON.stringify(AllAddressesTransferMapping) ?
                                        <Typography.Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>The manager can transfer any badge without the approval of the owner.</Typography.Text>
                                        : <>{collection.managerApprovedTransfers.map((transfer) => {
                                            return <>
                                                The manager can forcefully transfer badges from account IDs {transfer.to.accountNums.map((range, index) => {
                                                    return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                })} to account IDs {transfer.from.accountNums.map((range, index) => {
                                                    return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                                                })}.
                                                <br />
                                            </>
                                        })}</>}
                                </>
                        }
                    </div>
                    <br />
                </>


            }
        </>
    </InformationDisplayCard>
}