import { Col, Row, Typography, Divider } from "antd"
import { PRIMARY_TEXT } from "../../constants";
import { BitBadgeCollection } from "../../bitbadges-api/types";
import { TableRow } from "../common/TableRow";

const { Text } = Typography;

export function PermissionsOverview({
    badgeCollection
}: {
    badgeCollection: BitBadgeCollection
}) {
    if (!badgeCollection?.permissions) return <></>

    return <Row style={{ display: 'flex', justifyContent: 'center', width: '100%' }}  >
        <Col style={{ justifyContent: 'center', width: '100%' }}>
            <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                    Permissions
                </Text>
            </Row>
            <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
            {badgeCollection && <>
                {
                    !badgeCollection.permissions.CanFreeze &&
                        !badgeCollection.freezeRanges?.length &&
                        !badgeCollection.permissions.FrozenByDefault &&
                        !badgeCollection.permissions.CanCreate &&
                        !badgeCollection.permissions.CanUpdateUris &&
                        !badgeCollection.permissions.CanUpdateBytes &&
                        !badgeCollection.permissions.CanRevoke &&
                        !badgeCollection.permissions.CanManagerTransfer ?
                        <Typography.Text strong style={{ color: PRIMARY_TEXT, padding: 10 }}>
                            This collection is completely frozen!
                            Badges cannot be created, transferred, updated, or revoked!
                        </Typography.Text> :
                        <>
                            {
                                !badgeCollection.permissions.CanFreeze &&
                                    !badgeCollection.freezeRanges?.length ?
                                    <TableRow label={"Transferable?"} value={badgeCollection.permissions.FrozenByDefault ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                                    :
                                    <>
                                        {<TableRow label={"Transfer Type?"} value={badgeCollection.permissions.ForcefulTransfers ? 'Immediate' : 'Requires Approval'} labelSpan={16} valueSpan={8} />}
                                        {<TableRow label={"Can Freeze Addresses?"} value={badgeCollection.permissions.CanFreeze ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />}
                                        {<TableRow label={"Are Addresses Frozen By Default?"} value={badgeCollection.permissions.FrozenByDefault ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />}
                                        {badgeCollection && <TableRow label={`${badgeCollection.permissions.FrozenByDefault ? 'Unfrozen Addresses' : 'Frozen Addresses'}`} value={<div>
                                            {badgeCollection.freezeRanges.map((freezeRange) => {
                                                return <>{freezeRange.start}-{freezeRange.end}</>
                                            })}
                                            {badgeCollection.freezeRanges.length === 0 && 'None'}
                                        </div>} labelSpan={16} valueSpan={8} />}
                                    </>
                            }
                            {
                                <TableRow label={"Can More Badges Be Created?"} value={badgeCollection.permissions.CanCreate ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                            }
                            {
                                <TableRow label={"Can Badges Be Revoked?"} value={badgeCollection.permissions.CanRevoke ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                            }
                            {
                                <TableRow label={"Can Metadata Be Updated?"} value={badgeCollection.permissions.CanUpdateUris ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                            }
                            {
                                <TableRow label={"Can Manager Be Transferred?"} value={badgeCollection.permissions.CanManagerTransfer ? 'Yes' : 'No'} labelSpan={16} valueSpan={8} />
                            }
                        </>}
            </>}
        </Col>
    </Row >
}