import { Checkbox, Divider } from 'antd';
import { ActionPermission, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from 'bitbadgesjs-proto';
import { CollectionApprovedTransferPermissionWithDetails, validateActionPermissionUpdate, validateBalancesActionPermissionUpdate, validateCollectionApprovedTransferPermissionsUpdate, validateTimedUpdatePermissionUpdate, validateTimedUpdateWithBadgeIdsPermissionUpdate } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';


export function PermissionUpdateSelectWrapper({
  checked,
  setChecked,
  err,
  setErr,
  permissionName,
  existingCollectionId,
  node,
}: {
  checked: boolean,
  setChecked: (checked: boolean) => void,
  err: Error | null,
  setErr: (err: Error | null) => void,
  permissionName: string,
  existingCollectionId?: bigint,
  node: JSX.Element,
}) {
  const collections = useCollectionsContext();


  if (!existingCollectionId) return node;

  const existingCollection = collections.collections[existingCollectionId.toString()];
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (existingCollection && collection) {
    const oldPermissions = existingCollection.collectionPermissions[`${permissionName}` as keyof typeof existingCollection.collectionPermissions];
    const newPermissions = collection.collectionPermissions[`${permissionName}` as keyof typeof collection.collectionPermissions];


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
      case 'canUpdateInheritedBalances':
        err = validateTimedUpdateWithBadgeIdsPermissionUpdate(oldPermissions as TimedUpdateWithBadgeIdsPermission<bigint>[], newPermissions as TimedUpdateWithBadgeIdsPermission<bigint>[]);
        break;
      case 'canUpdateCollectionApprovedTransfers':
        err = validateCollectionApprovedTransferPermissionsUpdate(oldPermissions as CollectionApprovedTransferPermissionWithDetails<bigint>[], newPermissions as CollectionApprovedTransferPermissionWithDetails<bigint>[]);
        break;
    }

    setErr(err);
  }


  return (
    <>
      <div className='primary-text flex-center flex-column' >

        <div style={{ alignItems: 'center' }}>
          <Checkbox
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              if (existingCollection && collection) {


                const existingPermissions = existingCollection.collectionPermissions[`${permissionName}` as keyof typeof existingCollection.collectionPermissions];

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
            style={{ textAlign: 'left', alignItems: 'center' }}

          >
            {checked ? 'This property will be updated to the selected value below.' : 'Do not update this property. It will remain as currently set.'}
          </Checkbox>
        </div>
      </div>

      {checked && <>
        {err &&
          <><br />
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>{err.message}
              <br />
              <p>Please resolve this error before continuing. This error may have happened because this collection previously used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

              <Divider />
            </div></>}
        <br />
        {node}
      </>}
    </>
  )
}