import { AuditOutlined, BookOutlined, FormOutlined, MinusOutlined, UndoOutlined } from '@ant-design/icons';
import { Divider, Switch } from 'antd';
import { ActionPermission, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from 'bitbadgesjs-proto';
import { CollectionApprovalPermissionWithDetails, validateActionPermissionUpdate, validateBalancesActionPermissionUpdate, validateCollectionApprovalPermissionsUpdate, validateTimedUpdatePermissionUpdate, validateTimedUpdateWithBadgeIdsPermissionUpdate } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DEV_MODE, INFINITE_LOOP_MODE } from '../../../constants';
import { compareObjects } from '../../../utils/compare';
import { PermissionSelect, PermissionsOverview } from '../../collection-page/PermissionsInfo';
import IconButton from '../../display/IconButton';
import { BeforeAfterPermission, getCastFunctionsAndUsedFlags } from './BeforeAfterPermission';
import { JSONSetter } from './CustomJSONSetter';
import { ErrDisplay } from '../../common/ErrDisplay';
import { SwitchForm } from './SwitchForm';


export function PermissionUpdateSelectWrapper({
  checked,
  setChecked,
  err,
  setErr,
  permissionName,
  node,
  documentationLink
}: {
  checked: boolean,
  setChecked: (checked: boolean) => void,
  err: Error | null,
  setErr: (err: Error | null) => void,
  permissionName: string,
  node: () => JSX.Element,
  documentationLink?: string
}) {

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const startingCollection = txTimelineContext.startingCollection;

  const collection = useCollection(NEW_COLLECTION_ID);
  const [showBeforeAndAfter, setShowBeforeAndAfter] = useState(false);
  const [customJson, setCustomJson] = useState<boolean>(false);
  const [jsonErr, setJsonErr] = useState<Error | null>(null)
  const [formView, setFormView] = useState<boolean>(true);

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
        case 'canUpdateCollectionApprovals':
          err = validateCollectionApprovalPermissionsUpdate(oldPermissions as CollectionApprovalPermissionWithDetails<bigint>[], newPermissions as CollectionApprovalPermissionWithDetails<bigint>[]);
          break;
      }

      setErr(err);
    }
  }, [collection, startingCollection, permissionName, setErr]);

  const { flags } = getCastFunctionsAndUsedFlags(permissionName);

  const startingPermissions = startingCollection?.collectionPermissions[`${permissionName as keyof typeof startingCollection.collectionPermissions}`] ?? [] as any;
  const currPermissions = collection?.collectionPermissions[`${permissionName as keyof typeof collection.collectionPermissions}`] ?? [] as any;
  const isSameAsStarting = compareObjects(startingPermissions, currPermissions);

  return (
    <>
      <div className='primary-text flex-center flex-column'>
        <div style={{ alignItems: 'center', }} className='flex-center'>
          {checked && !!existingCollectionId &&
            <IconButton
              src={showBeforeAndAfter ? <MinusOutlined style={{ fontSize: 16 }} /> : <AuditOutlined style={{ fontSize: 16 }} />}
              text={showBeforeAndAfter ? 'Hide' : 'Changes'}
              tooltipMessage={showBeforeAndAfter ? 'Hide before and after' : 'Show before and after'}
              onClick={() => {
                setShowBeforeAndAfter(!showBeforeAndAfter);
              }}
            />}
          {/* {checked && !customJson &&
            <IconButton
              src={<CodeOutlined style={{ fontSize: 16 }} />}
              text={'JSON'}
              tooltipMessage='Custom JSON (Advanced)'
              onClick={() => {
                setCustomJson(true);
              }}
            />} */}
          {checked && customJson &&
            <IconButton
              src={<FormOutlined style={{ fontSize: 16 }} />}
              text={'Form'}
              tooltipMessage='Normal Form'
              onClick={() => {
                setCustomJson(false);
              }}
            />}
          {checked &&
            <IconButton
              src={<FormOutlined style={{ fontSize: 16 }} />}
              text={formView ? 'Advanced' : 'Normal'}
              tooltipMessage={formView ? 'Go to advanced view' : 'Go to normal view'}
              onClick={() => {
                setFormView(!formView);
              }}
            />}
          {checked &&
            <IconButton
              src={<UndoOutlined style={{ fontSize: 16 }} />}
              text={'Reset'}
              disabled={isSameAsStarting}
              tooltipMessage='Undo all changes'
              onClick={() => {
                if (startingCollection && collection) {
                  const existingPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      ...collection.collectionPermissions,
                      [`${permissionName}`]: existingPermissions
                    }
                  });
                } else if (collection && !startingCollection) {
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      ...collection.collectionPermissions,
                      [`${permissionName}`]: []
                    }
                  });
                }
              }}
            />}
          <IconButton
            src={<BookOutlined style={{ fontSize: 16 }} />}
            style={{ cursor: 'pointer' }}
            tooltipMessage={'Visit the BitBadges documentation to learn more about this concept.'}
            text={'Docs'}
            onClick={() => {
              window.open(documentationLink ?? `https://docs.bitbadges.io/overview/how-it-works/manager`, '_blank');
            }}
          />
        </div>

        {!isMint &&
          <Switch
            style={{ marginLeft: 10, marginBottom: 10 }}
            checked={checked}
            checkedChildren="Update"
            unCheckedChildren="Do Not Update"
            onChange={(e) => {
              setChecked(e);
              if (startingCollection && collection) {
                const existingPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    [`${permissionName}`]: existingPermissions
                  }
                });
              }
            }}
            className='primary-text'
          />}
      </div>
      {!checked && flags &&
        <>
          <br />
          <div className="full-width">
            <SwitchForm
              options={[{
                title: 'Do Not Update',
                message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager' ? ' For new collections, this means the value will be empty or unset.' : ''}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' ? ' For new collections, this means the manager will be set to your address by default.' : ''}`,
                isSelected: true,
                additionalNode: () => <>
                  <PermissionsOverview
                    collectionId={NEW_COLLECTION_ID}
                    permissionName={permissionName}
                  />
                </>,
              }]}
              onSwitchChange={() => { }}
            />
            <br />
          </div>
        </>}

      {checked && customJson && <>
        <JSONSetter
          setErr={setJsonErr}
          jsonPropertyPath={permissionName}
          isPermissionUpdate
        />

        {jsonErr && <ErrDisplay err={jsonErr} />}
        <br />
        <Divider />
      </>}
      {checked && flags && showBeforeAndAfter && <>
        <BeforeAfterPermission
          permissionName={permissionName}
        />
      </>}
      {checked && !customJson && <>
        {err &&
          <><br />
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b> The newly selected value for this permissions is updating a previously frozen value. See before / after.
              <br />

              {DEV_MODE && <>
                {err.message}
                <br />
              </>}

            </div></>}
        <br />

        {formView && node()}
        {!formView && <PermissionSelect
          collectionId={NEW_COLLECTION_ID}

          permissionName={permissionName}
          value={currPermissions}
          setValue={(value) => {
            if (collection) {
              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                collectionPermissions: {
                  ...collection.collectionPermissions,
                  [`${permissionName}`]: value
                }
              });
            }
          }}
        />}
      </>}

    </>
  )
}