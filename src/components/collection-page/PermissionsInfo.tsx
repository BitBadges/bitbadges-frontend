import { InfoCircleOutlined } from "@ant-design/icons";
import { Divider, Tooltip, Typography } from "antd";
import { AllAddressesTransferMapping } from "bitbadgesjs-utils";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";

export function PermissionsOverview({
  collectionId,
  span,
  isBadgeView,
  isOffChainBalances
}: {
  collectionId: bigint
  span?: number
  isBadgeView?: boolean,
  isOffChainBalances?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  if (!collection?.permissions) return <></>

  return <InformationDisplayCard title={'Manager Permissions'} span={span}>
    <>
      <>
        {!isBadgeView && <TableRow label={"Add badges to the collection?"} value={collection.permissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isBadgeView && <TableRow label={"Transfer the role of manager?"} value={collection.permissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Edit metadata URLs?"} value={collection.permissions.CanUpdateMetadataUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isOffChainBalances && <TableRow label={"Edit transferability?"} value={collection.permissions.CanUpdateAllowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Can delete collection?"} value={collection.permissions.CanDelete ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {isOffChainBalances && <TableRow label={"Can update balances?"} value={collection.permissions.CanUpdateBalancesUri ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}

        {!isOffChainBalances && <>
          <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
          <h3 className='primary-text'>{"Manager's Approved Transfers"}
            <Tooltip title="The manager's approved transfers are those that they can execute without needing the owner's permission. These transfers forcefully override any other transfer restrictions (e.g. non-transferable).">
              <InfoCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </h3>
          <div style={{ margin: 4 }} className='primary-text'>
            {
              !collection.managerApprovedTransfers?.length ?
                <Typography.Text style={{ fontSize: 16 }} className='primary-text'>None</Typography.Text>
                : <>
                  {/* //TODO: abstract to own component (there are a couple other places where this is used) */}
                  {collection.managerApprovedTransfers.length === 1
                    && JSON.stringify(collection.managerApprovedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
                    && JSON.stringify(collection.managerApprovedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from) ?
                    <Typography.Text style={{ fontSize: 16 }} className='primary-text'>{"The manager can transfer any badge to and from any address without the approval of the badge's owner."}</Typography.Text>
                    : <>{collection.managerApprovedTransfers.map((transfer) => {
                      return <>
                        The manager can forcefully transfer badges from addresses {transfer.from.addresses.map((range, index) => {
                          return <span key={index}>{index > 0 && ','} {range}</span>
                        })} to account IDs {transfer.to.addresses.map((range, index) => {
                          return <span key={index}>{index > 0 && ','} {range}</span>
                        })}.
                        <br />
                      </>
                    })}</>}
                </>
            }
          </div>
          <br />
        </>}
      </>
    </>
  </InformationDisplayCard>
}