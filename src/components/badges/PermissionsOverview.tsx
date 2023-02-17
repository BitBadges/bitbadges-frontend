import { Divider, Empty, Tooltip, Typography } from "antd"
import { PRIMARY_TEXT } from "../../constants";
import { BitBadgeCollection } from "../../bitbadges-api/types";
import { TableRow } from "../common/TableRow";
import { InformationDisplayCard } from "../common/InformationDisplayCard";
import { TransferDisplay } from "../common/TransferDisplay";
import { InfoCircleOutlined, InfoOutlined } from "@ant-design/icons";
import { AllAddressesTransferMapping } from "../../bitbadges-api/badges";

export function PermissionsOverview({
    badgeCollection,
    span
}: {
    badgeCollection: BitBadgeCollection
    span?: number
}) {
    if (!badgeCollection?.permissions) return <></>

    console.log(badgeCollection.managerApprovedTransfers[0], AllAddressesTransferMapping, badgeCollection.managerApprovedTransfers?.length === 1 && badgeCollection.managerApprovedTransfers[0] === AllAddressesTransferMapping)

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

                    {<TableRow label={"Add badges to the collection?"} value={badgeCollection.permissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Transfer the role of manager?"} value={badgeCollection.permissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
                    {<TableRow label={"Edit metadata URLs?"} value={badgeCollection.permissions.CanUpdateUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} /> //TODO: explain this does not mean the metadata can be updated; only the URL updates
                    }
                    {<TableRow label={"Edit transferability?"} value={badgeCollection.permissions.CanUpdateDisallowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}


                    <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                    <h3>{"Manager's Approved Transfers"}
                        <Tooltip title="The manager's approved transfers are those that they can a) execute without needing the owner's permission and b) execute even if the transfer is forbidden.">
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                    </h3>
                    <div style={{ margin: 4 }}>
                        {
                            !badgeCollection.managerApprovedTransfers?.length ?
                                <>The manager can not revoke or transfer any badge in this collection without approval of the badge owner.</>
                                : <>
                                    {badgeCollection.managerApprovedTransfers.length === 1
                                        && JSON.stringify(badgeCollection.managerApprovedTransfers[0]) === JSON.stringify(AllAddressesTransferMapping) ?
                                        <>The manager can revoke or transfer any badge in this collection without approval of the badge owner.</>
                                        : <>{badgeCollection.managerApprovedTransfers.map((transfer, index) => {
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