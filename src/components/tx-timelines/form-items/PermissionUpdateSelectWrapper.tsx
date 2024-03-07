import { AuditOutlined, BookOutlined, FormOutlined, MinusOutlined, UndoOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DEV_MODE, INFINITE_LOOP_MODE } from '../../../constants';
import { compareObjects } from '../../../utils/compare';
import { PermissionNameString, PermissionsOverview } from '../../collection-page/PermissionsInfo';
import { ErrDisplay } from '../../common/ErrDisplay';
import IconButton from '../../display/IconButton';
import { PermissionSelect } from '../../inputs/UniversalPermissionSelect';
import { BeforeAfterPermission } from './BeforeAfterPermission';
import { SwitchForm } from './SwitchForm';
import { getPermissionVariablesFromName } from 'bitbadgesjs-sdk';

export function PermissionUpdateSelectWrapper({
  checked,
  setChecked,
  err,
  setErr,
  permissionName,
  node,
  documentationLink
}: {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  err: Error | null;
  setErr: (err: Error | null) => void;
  permissionName: PermissionNameString;
  node: () => JSX.Element;
  documentationLink?: string;
}) {
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const startingCollection = txTimelineContext.startingCollection;

  const collection = useCollection(NEW_COLLECTION_ID);
  const [showBeforeAndAfter, setShowBeforeAndAfter] = useState(false);
  const [formView, setFormView] = useState<boolean>(true);

  const isMint = !existingCollectionId;
  const { flags } = getPermissionVariablesFromName(permissionName);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: permission update select wrapper, collectionId changed ');
    const { validatePermissionUpdateFunction } = getPermissionVariablesFromName(permissionName);
    if (startingCollection && collection) {
      const oldPermissions = startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];
      const newPermissions = collection.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];

      const err = validatePermissionUpdateFunction(oldPermissions, newPermissions);
      setErr(err);
    }
  }, [collection, startingCollection, permissionName, setErr]);

  const startingPermissions =
    startingCollection?.collectionPermissions[`${permissionName as keyof typeof startingCollection.collectionPermissions}`] ?? ([] as any);
  const currPermissions = collection?.collectionPermissions[`${permissionName as keyof typeof collection.collectionPermissions}`] ?? ([] as any);
  const isSameAsStarting = compareObjects(startingPermissions, currPermissions);

  return (
    <>
      <div className="primary-text flex-center flex-column">
        <div style={{ alignItems: 'center' }} className="flex-center">
          {checked && !!existingCollectionId && (
            <IconButton
              src={showBeforeAndAfter ? <MinusOutlined style={{ fontSize: 16 }} /> : <AuditOutlined style={{ fontSize: 16 }} />}
              text={showBeforeAndAfter ? 'Hide' : 'Changes'}
              tooltipMessage={showBeforeAndAfter ? 'Hide before and after' : 'Show before and after'}
              onClick={() => {
                setShowBeforeAndAfter(!showBeforeAndAfter);
              }}
            />
          )}
          {checked && (
            <IconButton
              src={<FormOutlined style={{ fontSize: 16 }} />}
              text={formView ? 'Advanced' : 'Normal'}
              tooltipMessage={formView ? 'Go to advanced view' : 'Go to normal view'}
              onClick={() => {
                setFormView(!formView);
              }}
            />
          )}
          {checked && (
            <IconButton
              src={<UndoOutlined style={{ fontSize: 16 }} />}
              text={'Reset'}
              disabled={isSameAsStarting}
              tooltipMessage="Undo all changes"
              onClick={() => {
                if (startingCollection && collection) {
                  const existingPermissions =
                    startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

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
            />
          )}
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

        {!isMint && (
          <Switch
            style={{ marginTop: 10, marginBottom: 10 }}
            checked={checked}
            checkedChildren="Update"
            unCheckedChildren="Do Not Update"
            onChange={(e) => {
              setChecked(e);
              if (startingCollection && collection) {
                const existingPermissions =
                  startingCollection.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];

                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    [`${permissionName}`]: existingPermissions
                  }
                });
              }
            }}
            className="primary-text"
          />
        )}
      </div>
      {!checked && flags && (
        <>
          <br />
          <div className="full-width">
            <SwitchForm
              options={[
                {
                  title: 'Do Not Update',
                  message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager' ? ' For new collections, this means the value will be empty or unset.' : ''}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' ? ' For new collections, this means the manager will be set to your address by default.' : ''}`,
                  isSelected: true,
                  additionalNode: () => (
                    <>
                      <PermissionsOverview collectionId={NEW_COLLECTION_ID} permissionName={permissionName} />
                    </>
                  )
                }
              ]}
              onSwitchChange={() => {}}
            />
            <br />
          </div>
        </>
      )}

      {checked && flags && showBeforeAndAfter && (
        <>
          <BeforeAfterPermission permissionName={permissionName} />
        </>
      )}
      {checked && (
        <>
          {err && (
            <>
              <br />
              <div style={{ color: 'red', textAlign: 'center' }}>
                <ErrDisplay err={err} />
                <br />
                {DEV_MODE && (
                  <>
                    {err.message}
                    <br />
                  </>
                )}
              </div>
            </>
          )}
          <br />

          {formView && node()}
          {/* Advanced permission select view */}
          {!formView && (
            <PermissionSelect
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
            />
          )}
        </>
      )}
    </>
  );
}
