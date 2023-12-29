import { Col, Row, Typography } from 'antd';
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UniversalPermission, UsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, validateBadgeMetadataUpdate, validateCollectionApprovalsUpdate, validateCollectionMetadataUpdate, validateIsArchivedUpdate, validateManagerUpdate, validateOffChainBalancesMetadataUpdate } from 'bitbadgesjs-utils';

import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { PermissionDisplay } from '../../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';


export function BeforeAfterPermission({
  permissionName,
}: {
  permissionName: string,
}) {

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = useCollection(NEW_COLLECTION_ID);

  const { castFunction, flags } = getCastFunctionsAndUsedFlags(permissionName);
  const oldPermissions = startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];
  const newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];

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
          <PermissionDisplay permissions={castFunction(oldPermissions as any)} usedFlags={flags} neverHasManager={noManager} />
        </Col>}
        <Col md={11} xs={24} style={{ textAlign: 'center' }}>
          <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
            Selected
          </Typography.Text>
          <br />
          <br />
          <PermissionDisplay permissions={castFunction(newPermissions as any)} usedFlags={flags} neverHasManager={noManager} />
        </Col>
      </Row>
    </InformationDisplayCard>
  </>
  )
}

export const getCastFunctionsAndUsedFlags = (permissionName: string) => {

  let castFunction: (permissions: any[]) => UniversalPermission[] = () => { return [] }
  let flags: UsedFlags = ApprovalPermissionUsedFlags

  let validateFunction: any = undefined;
  switch (permissionName) {
    case 'canArchiveCollection':
      validateFunction = validateIsArchivedUpdate;
      break;
    case 'canUpdateOffChainBalancesMetadata':
      validateFunction = validateOffChainBalancesMetadataUpdate;
      break;
    // case 'canUpdateStandards':
    // case 'canUpdateCustomData':
    case 'canUpdateManager':
      validateFunction = validateManagerUpdate
      break;
    case 'canUpdateCollectionMetadata':
      validateFunction = validateCollectionMetadataUpdate;
      break;
    case 'canUpdateBadgeMetadata':
      validateFunction = validateBadgeMetadataUpdate;
      break;
    case 'canUpdateCollectionApprovals':
      validateFunction = validateCollectionApprovalsUpdate
      break;
  }

  
  let question = "";
  switch (permissionName) {
    case 'canDeleteCollection':
      question = "Can delete the collection?";
      break;
    case 'canArchiveCollection':
      question = "Can archive the collection?";
      break;
    case 'canUpdateOffChainBalancesMetadata':
      question = "Can update the off-chain balances metadata?";
      break;
    case 'canUpdateStandards':
      question = "Can update the standards?";
      break;
    case 'canUpdateCustomData':
      question = "Can update the custom data?";
      break;
    case 'canUpdateManager':
      question = "Can update the manager?";
      break;
    case 'canUpdateCollectionMetadata':
      question = "Can update the collection metadata?";
      break;
    case 'canCreateMoreBadges':
      question = "Can create more badges?";
      break;
    case 'canUpdateBadgeMetadata':
      question = "Can update the badge metadata?";
      break;
    case 'canUpdateCollectionApprovals':
      question = "Can update collection approvals?";
      break;
    // Add custom questions for other permissions as needed
  }

  switch (permissionName) {
    case 'canDeleteCollection':
      castFunction = castActionPermissionToUniversalPermission;
      flags = ActionPermissionUsedFlags;
      break;
    case 'canArchiveCollection':
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

  if (!castFunction) throw new Error('');

  return {
    castFunction,
    flags,
    question,
    validateFunction
  }
}

export function AfterPermission({
  permissionName,
  onFreezePermitted
}: {
  permissionName: string,
  onFreezePermitted?: (frozen: boolean) => void
}) {

  const collection = useCollection(NEW_COLLECTION_ID);
  const { castFunction, flags } = getCastFunctionsAndUsedFlags(permissionName);
  const newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];

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