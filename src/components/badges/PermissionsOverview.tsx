import { Typography } from "antd"
import { PRIMARY_TEXT } from "../../constants";
import { BitBadgeCollection } from "../../bitbadges-api/types";
import { TableRow } from "../common/TableRow";
import { InformationDisplayCard } from "../common/InformationDisplayCard";

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
                    {<TableRow label={"Can Freeze Addresses?"} value={badgeCollection.permissions.CanUpdateDisallowed ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />}
                    {
                        !badgeCollection.disallowedTransfers?.length ?
                            <TableRow label={"Disallowed Transfers"} value={'None'} labelSpan={16} valueSpan={8} />
                            :
                            <>
                                {badgeCollection && <TableRow label={`${'Disallowed Transfers'}`} value={<div>
                                    <pre>
                                        {JSON.stringify(badgeCollection.disallowedTransfers, null, 2)}
                                    </pre>
                                    {/* {badgeCollection.disallowedTransfers.map((transfer) => {
                                        return <>
                                            Accounts{transfer.to.accountNums.map((accountRange) => {
                                                let start = Number(accountRange.start);
                                                let end = Number(accountRange.end);
                                                return <> {start}-{end}</>
                                            })}
                                        </>
                                    })} */}
                                </div>} labelSpan={16} valueSpan={8} />}
                            </>
                    }
                    {
                        <TableRow label={"Can Create Badges?"} value={badgeCollection.permissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                    }
                    {/* {TODO:
                        <TableRow label={"Can Badges Be Revoked?"} value={badgeCollection.permissions.CanRevoke ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                    } */}
                    {
                        <TableRow label={"Can Metadata Be Updated?"} value={badgeCollection.permissions.CanUpdateUris ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                    }
                    {
                        <TableRow label={"Can Manager Be Transferred?"} value={badgeCollection.permissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                    }
                    {/* //TODO: update bytes */}
                </>
            }
        </>
    </InformationDisplayCard>
}