import { Col, Row, Typography } from 'antd';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { PermissionDisplay } from '../../collection-page/PermissionsInfo';


export function BeforeAfterPermission({
  permissionName,
  existingCollectionId,
}: {
  permissionName: string,
  existingCollectionId?: bigint,
}) {
  const collections = useCollectionsContext();


  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  let castFunction: any = () => { }
  let flags;
  let oldPermissions = existingCollection?.collectionPermissions[`${permissionName}` as keyof typeof existingCollection.collectionPermissions];
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
      {existingCollection && <Col md={12} xs={24} style={{ textAlign: 'center' }}>
        <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
          Previous
        </Typography.Text>
        <br />
        <br />
        {PermissionDisplay(
          permissionName,
          castFunction(oldPermissions as any), '', flags as any
        )}
      </Col>}
      <Col md={12} xs={24} style={{ textAlign: 'center' }}>
        <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
          Selected
        </Typography.Text>
        <br />

        <br />
        {PermissionDisplay(
          permissionName,
          castFunction(newPermissions as any), '', flags as any
        )}
      </Col>
    </Row>
  </>
  )
}