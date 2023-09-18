import { AuditOutlined, CodeOutlined, FormOutlined, MinusOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Switch, Tooltip } from 'antd';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { DEV_MODE } from '../../../constants';
import { PermissionDisplay, getPermissionDetails } from '../../collection-page/PermissionsInfo';
import { JSONSetter } from './CustomJSONSetter';
import { SwitchForm } from './SwitchForm';

export function UpdateSelectWrapper({
  updateFlag,
  setUpdateFlag,
  node,
  jsonPropertyPath,
  permissionName,
  validationErr,
  mintOnly,
  nonMintOnly,
  disableJson,
  disableUndo,
  customValue,
  customSetValueFunction,
  customRevertFunction,
  onlyShowJson = false,
}: {
  setUpdateFlag: (val: boolean) => void,
  updateFlag: boolean,
  node: JSX.Element,
  jsonPropertyPath: string,
  permissionName: string,
  validationErr?: Error | null,
  mintOnly?: boolean,
  disableUndo?: boolean,
  nonMintOnly?: boolean,
  disableJson?: boolean,
  customValue?: any,
  customSetValueFunction?: (val: any) => void,
  customRevertFunction?: () => void,
  onlyShowJson?: boolean,
}) {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollectionId = txTimelineContext.existingCollectionId
  const isMint = !existingCollectionId

  const [err, setErr] = useState<string>('');
  const [customJson, setCustomJson] = useState<boolean>(onlyShowJson);
  const [showPermission, setShowPermission] = useState<boolean>(false);
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

  const permissionDataSource = jsonPropertyPath === "defaultUserApprovedIncomingTransfers" ? undefined : getPermissionDetails(
    castFunction(startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions] ?? []),
    flags as any
  );

  useEffect(() => {
    setCustomJson(onlyShowJson);
  }, [onlyShowJson])


  return (
    <>
      <div className='primary-text' >

        <div style={{ alignItems: 'center' }} className='flex-center flex-wrap full-width'>
          {!isMint &&
            <div style={{ marginTop: 10 }}>
              <Switch
                checkedChildren="Update"
                unCheckedChildren="Do not update"
                style={{ marginLeft: 10 }}
                checked={updateFlag}
                onChange={(e) => {
                  setUpdateFlag(e);
                }}
                className='primary-text'
              />
            </div>}
          <div style={{ marginTop: 10 }}>
            {updateFlag && !disableUndo &&
              <Tooltip
                color='black'
                placement='bottom'
                title={'Undo changes'}
              >
                <Avatar
                  className='styled-button'
                  src={<UndoOutlined style={{ fontSize: 16 }} />}
                  style={{ marginLeft: 10, cursor: 'pointer' }}
                  onClick={() => {
                    if (customRevertFunction) {
                      customRevertFunction();
                    } else {

                      if (startingCollection && collection) {
                        const existingValue = startingCollection[jsonPropertyPath as keyof typeof startingCollection];

                        collections.updateCollection({
                          ...collection,
                          [`${jsonPropertyPath}`]: existingValue
                        });

                      } else if (collection && !startingCollection) {
                        collections.updateCollection({
                          ...collection,
                          [`${jsonPropertyPath}`]: []
                        });
                      }
                    }
                  }}
                />
              </Tooltip>}
            {updateFlag && !customJson && !disableJson && !onlyShowJson &&
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
            {updateFlag && customJson && !disableJson && !onlyShowJson &&
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
            {updateFlag && jsonPropertyPath !== "defaultUserApprovedIncomingTransfers" &&
              <Tooltip
                color='black'
                placement='bottom'
                title={showPermission ? 'Hide Permission' : 'Show Permission'}
              >
                <Avatar
                  className='styled-button'
                  src={showPermission ? <MinusOutlined style={{ fontSize: 16 }} /> : <AuditOutlined style={{ fontSize: 16 }} />}
                  style={{ marginLeft: 10, cursor: 'pointer' }}
                  onClick={() => {
                    setShowPermission(!showPermission);
                  }}
                />
              </Tooltip>}
          </div>
        </div>

        {(permissionDataSource?.hasForbiddenTimes) && updateFlag &&
          <div className='' style={{ textAlign: 'center' }}>
            <br />
            {validationErr ?
              <div style={{ color: 'red', textAlign: 'center' }}>
                <b>Error: </b>You are attempting to update a previously frozen value. Please resolve this error before continuing. See permission for more details.
                {DEV_MODE && <>
                  <br />
                  {validationErr.message}
                </>}
              </div>
              : <>
                <WarningOutlined style={{ color: 'orange', fontSize: 16, marginRight: 4 }} />
                <b>Updating certain values may be frozen and disallowed. See permission for more details.</b>
                <br />
              </>}

          </div>}
      </div>
      {!updateFlag &&
        <div style={{ textAlign: 'center' }} className='primary-text flex-center flex-column' >
          <br />
          <SwitchForm
            options={[{
              title: 'Do Not Update',
              message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager'
                  && jsonPropertyPath !== "defaultUserApprovedIncomingTransfers" ? ' For new collections, this means the value will be empty or unset.' : ''}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' ? ' For new collections, this means the manager will be set to your address by default.' : ''}
                  ${existingCollectionId && permissionName == 'defaultUserApprovedIncomingTransfers' ? ' This means that users will have to opt-in to all incoming transfers by default.' : ''}
                  `,
              isSelected: true,
            },
            ]}
            onSwitchChange={() => { }}
          />
        </div>}

      {showPermission && jsonPropertyPath !== "defaultUserApprovedIncomingTransfers" ? <>
        <br />
        {
          PermissionDisplay(
            permissionName,
            castFunction(startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions] ?? []),
            flags as any,
            undefined,
            undefined,
            mintOnly,
            nonMintOnly,
          )
        }
      </> : <></>}
      {updateFlag && !customJson && <>
        <br />
        {node}
      </>}
      {updateFlag && customJson && <>
        <JSONSetter
          setErr={setErr}
          jsonPropertyPath={jsonPropertyPath}
          customValue={customValue}
          customSetValueFunction={customSetValueFunction}
        />

        {err && <div className='flex-center' style={{ color: 'red' }}>
          {err}
        </div>}
        <br />
      </>}
    </>
  )
}