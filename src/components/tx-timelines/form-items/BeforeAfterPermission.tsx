import { Col, Row, Typography } from 'antd';
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';

import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { PermissionDisplay } from '../../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';


export function BeforeAfterPermission({
  permissionName,
}: {
  permissionName: string,
}) {

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = useCollection(NEW_COLLECTION_ID);

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
      case 'canUpdateCollectionApprovals':
        castFunction = castCollectionApprovalPermissionToUniversalPermission;
        flags = ApprovalPermissionUsedFlags;
        break;
    }
  }

  if (!collection) return <></>;

  const noManager = neverHasManager(collection);

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
          <PermissionDisplay permissions={castFunction(oldPermissions as any)} usedFlags={flags as any} neverHasManager={noManager} />
        </Col>}
        <Col md={11} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
            Selected
          </Typography.Text>
          <br />

          <br />
          <PermissionDisplay permissions={castFunction(newPermissions as any)} usedFlags={flags as any} neverHasManager={noManager} />
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

  const collection = useCollection(NEW_COLLECTION_ID);

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
      case 'canUpdateCollectionApprovals':
        castFunction = castCollectionApprovalPermissionToUniversalPermission;
        flags = ApprovalPermissionUsedFlags;
        break;
    }
  }

  if (!collection) return <></>;

  const noManager = neverHasManager(collection);

  return (<>
    {/* <hr /> */}
    <Row className="full-width flex-center" justify="center" style={{ alignItems: 'normal' }}>
      <br />
      <br />

      <Col md={24} xs={24} style={{ textAlign: 'center' }}>
        <PermissionDisplay
          permissions={castFunction(newPermissions as any)}
          usedFlags={flags as any}
          onFreezePermitted={onFreezePermitted}
          neverHasManager={noManager}
        />
      </Col>
    </Row>
  </>
  )
}