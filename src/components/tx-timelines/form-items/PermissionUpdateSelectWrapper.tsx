import { AuditOutlined, CodeOutlined, FormOutlined, MinusOutlined, UndoOutlined } from '@ant-design/icons';
import { Avatar, Col, Divider, Row, Switch, Tooltip } from 'antd';
import { ActionPermission, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from 'bitbadgesjs-proto';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, CollectionApprovedTransferPermissionWithDetails, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, validateActionPermissionUpdate, validateBalancesActionPermissionUpdate, validateCollectionApprovedTransferPermissionsUpdate, validateTimedUpdatePermissionUpdate, validateTimedUpdateWithBadgeIdsPermissionUpdate } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { DEV_MODE, INFINITE_LOOP_MODE } from '../../../constants';
import { PermissionDisplay } from '../../collection-page/PermissionsInfo';
import { BeforeAfterPermission } from './BeforeAfterPermission';
import { JSONSetter } from './CustomJSONSetter';
import { SwitchForm } from './SwitchForm';


export function PermissionUpdateSelectWrapper({
  checked,
  setChecked,
  err,
  setErr,
  permissionName,
  node,
}: {
  checked: boolean,
  setChecked: (checked: boolean) => void,
  err: Error | null,
  setErr: (err: Error | null) => void,
  permissionName: string,
  node: JSX.Element,
}) {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const startingCollection = txTimelineContext.startingCollection;

  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [showBeforeAndAfter, setShowBeforeAndAfter] = useState(true);
  const [customJson, setCustomJson] = useState<boolean>(false);
  const [jsonErr, setJsonErr] = useState<string>('');

  const isMint = !existingCollectionId;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: permission update select wrapper, collectionId changed ');

    if (startingCollection && collection) {
      const oldPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];
      const newPermissions = collection.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];

      let err = null;
      switch (permissionName) {
        case 'canDeleteCollection':
          err = validateActionPermissionUpdate(oldPermissions as ActionPermission<bigint>[], newPermissions as ActionPermission<bigint>[]);

          break;
        case 'canArchiveCollection':
        case 'canUpdateContractAddress':
        case 'canUpdateOffChainBalancesMetadata':
        case 'canUpdateStandards':
        case 'canUpdateCustomData':
        case 'canUpdateManager':
        case 'canUpdateCollectionMetadata':
          err = validateTimedUpdatePermissionUpdate(oldPermissions as TimedUpdatePermission<bigint>[], newPermissions as TimedUpdatePermission<bigint>[]);

          break;
        case 'canCreateMoreBadges':
          err = validateBalancesActionPermissionUpdate(oldPermissions as BalancesActionPermission<bigint>[], newPermissions as BalancesActionPermission<bigint>[]);

          break;
        case 'canUpdateBadgeMetadata':
          // case 'canUpdateInheritedBalances':
          err = validateTimedUpdateWithBadgeIdsPermissionUpdate(oldPermissions as TimedUpdateWithBadgeIdsPermission<bigint>[], newPermissions as TimedUpdateWithBadgeIdsPermission<bigint>[]);

          break;
        case 'canUpdateCollectionApprovedTransfers':
          err = validateCollectionApprovedTransferPermissionsUpdate(oldPermissions as CollectionApprovedTransferPermissionWithDetails<bigint>[], newPermissions as CollectionApprovedTransferPermissionWithDetails<bigint>[]);
          break;
      }

      setErr(err);
    }
  }, [collection, startingCollection, permissionName, setErr]);

  let castFunction: any = () => { }
  let flags;
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



  return (
    <>
      <div className='primary-text flex-center flex-column' >

        <div style={{ alignItems: 'center' }}>
          {!isMint &&
            <Switch
              style={{ marginLeft: 10 }}
              checked={checked}
              checkedChildren="Update"
              unCheckedChildren="Do Not Update"
              onChange={(e) => {
                setChecked(e);
                if (startingCollection && collection) {
                  const existingPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

                  collections.updateCollection({
                    ...collection,
                    collectionPermissions: {
                      ...collection.collectionPermissions,
                      [`${permissionName}`]: existingPermissions
                    }
                  });
                }
              }}
              className='primary-text'
            />}
          {checked &&
            <Tooltip
              title={'Undo changes'}
            >
              <Avatar
                className='styled-button'
                src={<UndoOutlined style={{ fontSize: 16 }} />}
                style={{ marginLeft: 10, cursor: 'pointer' }}
                onClick={() => {
                  if (startingCollection && collection) {
                    const existingPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

                    collections.updateCollection({
                      ...collection,
                      collectionPermissions: {
                        ...collection.collectionPermissions,
                        [`${permissionName}`]: existingPermissions
                      }
                    });
                  } else if (collection && !startingCollection) {
                    collections.updateCollection({
                      ...collection,
                      collectionPermissions: {
                        ...collection.collectionPermissions,
                        [`${permissionName}`]: []
                      }
                    });
                  }
                }}
              />
            </Tooltip>}
          {checked &&
            <Tooltip
              title={showBeforeAndAfter ? 'Hide before and after' : 'Show before and after'}
            >
              <Avatar
                className='styled-button'
                src={showBeforeAndAfter ? <MinusOutlined style={{ fontSize: 16 }} /> : <AuditOutlined style={{ fontSize: 16 }} />}
                style={{ marginLeft: 10, cursor: 'pointer' }}
                onClick={() => {
                  setShowBeforeAndAfter(!showBeforeAndAfter);
                }}
              />
            </Tooltip>}
          {checked && !customJson &&
            <Tooltip
              color='black'
              placement='bottom'
              title={'Custom JSON (Advanced)'}
            >
              <Avatar
                className='styled-button'
                src={<CodeOutlined style={{ fontSize: 16 }} />}
                style={{ marginLeft: 10, cursor: 'pointer' }}
                onClick={() => {
                  setCustomJson(true);
                }}
              />
            </Tooltip>}
          {checked && customJson &&
            <Tooltip
              color='black'
              placement='bottom'
              title={'Normal Form'}
            >
              <Avatar
                className='styled-button'
                src={<FormOutlined style={{ fontSize: 16 }} />}
                style={{ marginLeft: 10, cursor: 'pointer' }}
                onClick={() => {
                  setCustomJson(false);
                }}
              />
            </Tooltip>}


        </div>
      </div>



      {!checked && castFunction && flags &&
        <>
          <br />
          <Row className="full-width flex-center" justify="center">
            <Col md={12} xs={24} style={{ textAlign: 'center' }}>
              <SwitchForm
                options={[{
                  title: 'Do Not Update',
                  message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager' && ' For new collections, this means the value will be empty or unset.'}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' && ' For new collections, this means the manager will be set to your address by default.'}`,
                  isSelected: true,
                },
                ]}
                onSwitchChange={() => { }}
              />
              <br />

              <br />
              {PermissionDisplay(
                permissionName,
                castFunction(
                  startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions] ?? []
                ), flags as any
              )}
            </Col>
          </Row>
        </>}

      {checked && customJson && <>
        <JSONSetter
          setErr={setJsonErr}
          jsonPropertyPath={permissionName}
          isPermissionUpdate
        />

        {jsonErr && <div className='flex-center' style={{ color: 'red' }}>
          {jsonErr}
        </div>}
        <br />
        <Divider />
      </>}

      {checked && !customJson && <>
        {err &&
          <><br />
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b> The newly selected value for this permissions is updating a previously frozen value.
              <br />

              {DEV_MODE && <>
                {err.message}
                <br />
              </>}

            </div></>}
        <br />
        {node}
      </>}
      {checked && castFunction && flags && showBeforeAndAfter && <>
        <BeforeAfterPermission
          permissionName={permissionName}
        />
      </>}
    </>
  )
}