import { CheckCircleFilled, ClockCircleFilled, StopOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { GetFirstMatchOnly, invertUintRanges, removeUintRangeFromUintRange } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE, getTimeRangesString } from "../../utils/dates";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";



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
  const collection = collections.collections[collectionId.toString()]

  console.log(isBadgeView, isOffChainBalances) //For TS

  if (!collection?.collectionPermissions) return <></>

  const forbiddenDeleteTimes = [];
  const permittedDeleteTimes = [];
  const neutralDeleteTimes = [];
  //TODO: This is simple ActionPermission and not taking into account first-match only
  let allTimeRanges = [{ start: 1n, end: FOREVER_DATE }];

  for (const deletePermission of collection.collectionPermissions.canDeleteCollection) {
    for (const combination of deletePermission.combinations) {
      let permittedTimes = deletePermission.defaultValues.permittedTimes;
      if (combination.permittedTimesOptions.invertDefault) {
        permittedTimes = invertUintRanges(permittedTimes, 1n, FOREVER_DATE);
      } else if (combination.permittedTimesOptions.allValues) {
        permittedTimes = [{ start: 1n, end: FOREVER_DATE }];
      } else if (combination.permittedTimesOptions.noValues) {
        permittedTimes = [];
      }

      let forbiddenTimes = deletePermission.defaultValues.forbiddenTimes;
      if (combination.forbiddenTimesOptions.invertDefault) {
        forbiddenTimes = invertUintRanges(forbiddenTimes, 1n, FOREVER_DATE);
      } else if (combination.forbiddenTimesOptions.allValues) {
        forbiddenTimes = [{ start: 1n, end: FOREVER_DATE }];
      } else if (combination.forbiddenTimesOptions.noValues) {
        forbiddenTimes = [];
      }

      console.log(permittedTimes, forbiddenTimes)

      forbiddenDeleteTimes.push(...forbiddenTimes);
      permittedDeleteTimes.push(...permittedTimes);

      const [remaining, _] = removeUintRangeFromUintRange(forbiddenTimes, allTimeRanges)
      allTimeRanges = remaining;

      const [remaining2, _x] = removeUintRangeFromUintRange(permittedTimes, allTimeRanges)
      allTimeRanges = remaining2;
    }
  }
  neutralDeleteTimes.push(...allTimeRanges);

  console.log(forbiddenDeleteTimes, permittedDeleteTimes, neutralDeleteTimes)

  return <InformationDisplayCard title={'Manager Permissions'} span={span}>
    <>
      <>
        {!isBadgeView && <TableRow label={"Delete collection?"} value={
          <>
            {/* {forbiddenDeleteTimes.length > 0 && (permittedDeleteTimes.length > 0 || neutralDeleteTimes.length > 0) &&
              "Time-Dependent"}
            {forbiddenDeleteTimes.length > 0 && permittedDeleteTimes.length == 0 && neutralDeleteTimes.length == 0 &&
              "Forbidden"}
            {forbiddenDeleteTimes.length == 0 && (permittedDeleteTimes.length > 0 || neutralDeleteTimes.length > 0) &&
              "Permitted"} */}

            {forbiddenDeleteTimes.length > 0 && neutralDeleteTimes.length == 0 && permittedDeleteTimes.length == 0 &&
              <Tooltip color='black' title={getTimeRangesString(forbiddenDeleteTimes, 'Forbidden (cannot be changed)', true)}>
                <StopOutlined style={{ marginLeft: 8, color: 'red' }} />
              </Tooltip>}
            {permittedDeleteTimes.length > 0 && neutralDeleteTimes.length == 0 && forbiddenDeleteTimes.length == 0 &&
              <Tooltip color='black' title={getTimeRangesString(permittedDeleteTimes, 'Permitted (cannot be changed)', true)}>
                <CheckCircleFilled style={{ marginLeft: 8, color: 'green' }} />
              </Tooltip>}
            {!(forbiddenDeleteTimes.length > 0 && neutralDeleteTimes.length == 0 && permittedDeleteTimes.length == 0)
              && !(permittedDeleteTimes.length > 0 && neutralDeleteTimes.length == 0 && forbiddenDeleteTimes.length == 0) &&
              <>
                <Tooltip color='black' title={<div style={{ textAlign: 'center' }}>
                  {"Time-Dependent"}
                  {neutralDeleteTimes.length > 0 && <>
                    <br />
                    <br />
                    {getTimeRangesString(neutralDeleteTimes, 'Deletable (but can be set to non-deletable)', true)}
                  </>}
                  {permittedDeleteTimes.length > 0 && <>
                    <br />
                    <br />
                    {getTimeRangesString(permittedDeleteTimes, 'Will always be deletable (cannot be changed)', true)}
                  </>}
                  {forbiddenDeleteTimes.length > 0 && <>
                    <br />
                    <br />
                    {getTimeRangesString(forbiddenDeleteTimes, 'Will always be non-deletable (cannot be changed)', true)}
                  </>}
                </div>
                }>
                  <ClockCircleFilled style={{ marginLeft: 8 }} />
                </Tooltip>
              </>}
          </>} labelSpan={20} valueSpan={4} />}

        {!isBadgeView && <TableRow label={"Archive collection?"} value={collection.collectionPermissions.canArchiveCollection ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}



        {!isBadgeView && <TableRow label={"Add badges to the collection?"} value={collection.collectionPermissions.CanCreateMoreBadges ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isBadgeView && <TableRow label={"Transfer the role of manager?"} value={collection.collectionPermissions.CanManagerBeTransferred ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Edit metadata URLs?"} value={collection.collectionPermissions.CanUpdateMetadataUris ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {!isOffChainBalances && <TableRow label={"Edit transferability?"} value={collection.collectionPermissions.CanUpdateAllowed ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {<TableRow label={"Can delete collection?"} value={collection.collectionPermissions.CanDelete ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
        {isOffChainBalances && <TableRow label={"Can update balances?"} value={collection.collectionPermissions.CanUpdateBalancesUri ? 'Yes' : 'No'} labelSpan={20} valueSpan={4} />}
      </>
    </>
  </InformationDisplayCard>
}