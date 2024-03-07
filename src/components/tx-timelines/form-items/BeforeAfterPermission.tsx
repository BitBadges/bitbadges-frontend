import { Col, Row, Typography } from 'antd';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { PermissionDisplayTable, PermissionNameString } from '../../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { iCollectionPermissionsWithDetails } from 'bitbadgesjs-sdk';

export function BeforeAfterPermission({ permissionName }: { permissionName: PermissionNameString }) {
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = useCollection(NEW_COLLECTION_ID);

  const oldPermissions = startingCollection?.collectionPermissions[`${permissionName}` as keyof iCollectionPermissionsWithDetails<bigint>];
  const newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof iCollectionPermissionsWithDetails<bigint>];

  if (!collection || !oldPermissions || !newPermissions) return <></>;

  const noManager = neverHasManager(collection);

  return (
    <>
      {/* <hr /> */}
      <InformationDisplayCard title="">
        <Row className="full-width flex-between" justify="center" style={{ alignItems: 'normal' }}>
          {startingCollection && (
            <Col md={11} xs={24} style={{ textAlign: 'center' }}>
              <Typography.Text
                className="primary-text"
                strong
                style={{
                  textAlign: 'center',
                  alignContent: 'center',
                  fontSize: 24,
                  alignItems: 'center'
                }}
              >
                Previous
              </Typography.Text>
              <br />
              <br />
              <PermissionDisplayTable permissions={oldPermissions} permissionName={permissionName} neverHasManager={noManager} />
            </Col>
          )}
          <Col md={11} xs={24} style={{ textAlign: 'center' }}>
            <Typography.Text
              className="primary-text"
              strong
              style={{
                textAlign: 'center',
                alignContent: 'center',
                fontSize: 24,
                alignItems: 'center'
              }}
            >
              Selected
            </Typography.Text>
            <br />
            <br />
            <PermissionDisplayTable permissions={newPermissions} permissionName={permissionName} neverHasManager={noManager} />
          </Col>
        </Row>
      </InformationDisplayCard>
    </>
  );
}

export function AfterPermission({
  permissionName,
  onFreezePermitted
}: {
  permissionName: PermissionNameString;
  onFreezePermitted?: (frozen: boolean) => void;
}) {
  const collection = useCollection(NEW_COLLECTION_ID);
  const newPermissions = collection?.collectionPermissions[`${permissionName}` as keyof iCollectionPermissionsWithDetails<bigint>];
  if (!collection) return <></>;

  const noManager = neverHasManager(collection);

  return (
    <>
      <Row className="full-width flex-center" justify="center" style={{ alignItems: 'normal' }}>
        <br />
        <br />

        <Col md={24} xs={24} style={{ textAlign: 'center' }}>
          <PermissionDisplayTable
            permissions={newPermissions ?? []}
            permissionName={permissionName}
            onFreezePermitted={onFreezePermitted}
            neverHasManager={noManager}
          />
        </Col>
      </Row>
    </>
  );
}
