import { Col, Row, Typography } from 'antd';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { PermissionDisplay } from '../../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';


export function BeforeAfterPermission({
  permissionName,
}: {
  permissionName: string,
}) {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  let castFunction: any = () => { }
  let flags;
  let oldPermissions = startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];
  let newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];
  if (collection) {

    switch (permissionName) {
      case 'canDeleteCollection':
        castFunction = castActionPermissionToUniversalPermission;
        flags = ActionPermissionUsedFlags;
        break;
      case 'canArchiveCollection':
      case 'canUpdateContractAddress':
      case 'canUpdateOffChainBalancesMetadata':
      case 'canUpdateStandards':
      case 'canUpdateCustomData':
      case 'canUpdateManager':
      case 'canUpdateCollectionMetadata':
        castFunction = castTimedUpdatePermissionToUniversalPermission;
        flags = TimedUpdatePermissionUsedFlags
        break;
      case 'canCreateMoreBadges':
        castFunction = castBalancesActionPermissionToUniversalPermission;
        flags = BalancesActionPermissionUsedFlags;
        break;
      case 'canUpdateBadgeMetadata':
        // case 'canUpdateInheritedBalances':
        castFunction = castTimedUpdateWithBadgeIdsPermissionToUniversalPermission;
        flags = TimedUpdateWithBadgeIdsPermissionUsedFlags;
        break;
      case 'canUpdateCollectionApprovedTransfers':
        castFunction = castCollectionApprovedTransferPermissionToUniversalPermission;
        flags = ApprovedTransferPermissionUsedFlags;
        break;
    }
  }

  if (!collection) return <></>;


  return (<>
    {/* <hr /> */}
    <InformationDisplayCard title=''>
      <Row className="full-width flex-between" justify="center" style={{ alignItems: 'normal' }}>

        {startingCollection && <Col md={11} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
            Previous
          </Typography.Text>
          <br />
          <br />
          {PermissionDisplay(
            permissionName,
            castFunction(oldPermissions as any), flags as any
          )}
        </Col>}
        <Col md={11} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
            Selected
          </Typography.Text>
          <br />

          <br />
          {PermissionDisplay(
            permissionName,
            castFunction(newPermissions as any), flags as any
          )}
        </Col>
      </Row>
    </InformationDisplayCard>
  </>
  )
}


export function AfterPermission({
  permissionName,
  onFreezePermitted
}: {
  permissionName: string,
  onFreezePermitted?: (frozen: boolean) => void
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  let castFunction: any = () => { }
  let flags;
  let newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];
  if (collection) {

    switch (permissionName) {
      case 'canDeleteCollection':
        castFunction = castActionPermissionToUniversalPermission;
        flags = ActionPermissionUsedFlags;
        break;
      case 'canArchiveCollection':
      case 'canUpdateContractAddress':
      case 'canUpdateOffChainBalancesMetadata':
      case 'canUpdateStandards':
      case 'canUpdateCustomData':
      case 'canUpdateManager':
      case 'canUpdateCollectionMetadata':
        castFunction = castTimedUpdatePermissionToUniversalPermission;
        flags = TimedUpdatePermissionUsedFlags
        break;
      case 'canCreateMoreBadges':
        castFunction = castBalancesActionPermissionToUniversalPermission;
        flags = BalancesActionPermissionUsedFlags;
        break;
      case 'canUpdateBadgeMetadata':
        // case 'canUpdateInheritedBalances':
        castFunction = castTimedUpdateWithBadgeIdsPermissionToUniversalPermission;
        flags = TimedUpdateWithBadgeIdsPermissionUsedFlags;
        break;
      case 'canUpdateCollectionApprovedTransfers':
        castFunction = castCollectionApprovedTransferPermissionToUniversalPermission;
        flags = ApprovedTransferPermissionUsedFlags;
        break;
    }
  }

  if (!collection) return <></>;


  return (<>
    {/* <hr /> */}
    <Row className="full-width flex-center" justify="center" style={{ alignItems: 'normal' }}>
      <br />
      <br />

      <Col md={24} xs={24} style={{ textAlign: 'center' }}>
        {PermissionDisplay(
          permissionName,
          castFunction(newPermissions as any), flags as any,
          undefined,
          undefined,
          undefined,
          undefined,
          onFreezePermitted
        )}
      </Col>
    </Row>
  </>
  )
}