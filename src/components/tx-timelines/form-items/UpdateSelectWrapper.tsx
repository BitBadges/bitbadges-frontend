import { AuditOutlined, CodeOutlined, FormOutlined, MinusOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, UsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, validateBadgeMetadataUpdate, validateCollectionApprovalsUpdate, validateCollectionMetadataUpdate, validateContractAddressUpdate, validateIsArchivedUpdate, validateManagerUpdate, validateOffChainBalancesMetadataUpdate } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { PermissionDisplay, getPermissionDetails } from '../../collection-page/PermissionsInfo';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { JSONSetter } from './CustomJSONSetter';
import { ErrDisplay } from './ErrDisplay';
import { SwitchForm } from './SwitchForm';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';

export function UpdateSelectWrapper({
  updateFlag,
  setUpdateFlag,
  node,
  jsonPropertyPath,
  permissionName,
  mintOnly,
  nonMintOnly,
  disableJson,
  disableUndo,
  customValue,
  customSetValueFunction,
  customRevertFunction,
  onlyShowJson = false,
  err,
  setErr
}: {
  setUpdateFlag: (val: boolean) => void,
  updateFlag: boolean,
  node: JSX.Element,
  jsonPropertyPath: string,
  permissionName: string,
  mintOnly?: boolean,
  disableUndo?: boolean,
  nonMintOnly?: boolean,
  disableJson?: boolean,
  customValue?: any,
  customSetValueFunction?: (val: any) => void,
  customRevertFunction?: () => void,
  onlyShowJson?: boolean,
  err: Error | null,
  setErr: (err: Error | null) => void,
}) {

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = useCollection(NEW_COLLECTION_ID);
  const existingCollectionId = txTimelineContext.existingCollectionId
  const isMint = !existingCollectionId

  const [customJson, setCustomJson] = useState<boolean>(onlyShowJson);
  const [showPermission, setShowPermission] = useState<boolean>(false);
  const [jsonErr, setJsonErr] = useState<Error | null>(null);

  let castFunction: any = () => { }
  let validateFunction: any = undefined;
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
      case 'canUpdateCollectionApprovals':
        castFunction = castCollectionApprovalPermissionToUniversalPermission;
        flags = ApprovalPermissionUsedFlags;
        break;
    }

    switch (permissionName) {
      case 'canArchiveCollection':
        validateFunction = validateIsArchivedUpdate;
        break;
      case 'canUpdateContractAddress':
        validateFunction = validateContractAddressUpdate;
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
        console.log('collection approval update')
        break;
    }
  }

  const prevPermissions = startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions];
  const noManager = collection ? neverHasManager(collection) : true;
  const permissionDataSource = jsonPropertyPath === "defaultUserIncomingApprovals" ? undefined : getPermissionDetails(
    castFunction(prevPermissions),
    flags as any,
    noManager
  );

  const currValue = collection ? collection[jsonPropertyPath as keyof typeof collection] : undefined;
  const startingValue = startingCollection ? startingCollection[jsonPropertyPath as keyof typeof startingCollection] : undefined;


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update select wrapper: ', jsonPropertyPath);
    let validateErr: Error | null = null;
    if (validateFunction && startingValue !== undefined && currValue !== undefined) {
      validateErr = validateFunction(startingValue, currValue, prevPermissions);
      setErr(validateErr);
      console.log('validateErr: ', validateErr);
    }

  }, [currValue, startingValue, prevPermissions, permissionName, jsonPropertyPath, setErr, validateFunction])

  useEffect(() => {
    setCustomJson(onlyShowJson);
  }, [onlyShowJson])

  let question = "";
  switch (permissionName) {
    case 'canDeleteCollection':
      question = "Can delete the collection?";
      break;
    case 'canArchiveCollection':
      question = "Can archive the collection?";
      break;
    case 'canUpdateContractAddress':
      question = "Can update the contract address?";
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
      question = "Can update collection approved transfers?";
      break;
    // Add custom questions for other permissions as needed
  }


  return (
    <>
      <div className='dark:text-white flex-center flex-column' >
        <div style={{ alignItems: 'center' }} className='flex-center flex-wrap full-width'>
          {!!existingCollectionId && updateFlag && jsonPropertyPath !== "defaultUserIncomingApprovals" &&
            <IconButton
              src={showPermission ? <MinusOutlined style={{ fontSize: 16 }} /> : <AuditOutlined style={{ fontSize: 16 }} />}
              style={{ cursor: 'pointer' }}
              tooltipMessage={showPermission ? 'Hide Permission' : 'Show Permission'}
              text={showPermission ? 'Hide' : 'Permission'}
              onClick={() => {
                setShowPermission(!showPermission);
              }}
            />
          }
          {/* {updateFlag && !customJson && !disableJson && !onlyShowJson &&
            <IconButton
              src={<CodeOutlined style={{ fontSize: 16 }} />}
              style={{ cursor: 'pointer' }}
              tooltipMessage={'Custom JSON (Advanced Option)'}
              text={'JSON'}
              onClick={() => {
                setCustomJson(true);
              }}
            />} */}
          {updateFlag && customJson && !disableJson && !onlyShowJson &&
            <IconButton
              src={<FormOutlined style={{ fontSize: 16 }} />}
              style={{ cursor: 'pointer' }}
              tooltipMessage={'Normal Form'}
              text={'Form'}
              onClick={() => {
                setCustomJson(false);
              }}
            />}

          {updateFlag && !disableUndo &&
            <IconButton
              src={<UndoOutlined style={{ fontSize: 16 }} />}
              style={{ cursor: 'pointer' }}
              tooltipMessage={'Undo changes'}
              text={'Reset'}
              onClick={() => {
                if (customRevertFunction) {
                  customRevertFunction();
                } else {

                  if (startingCollection && collection) {
                    const existingValue = startingCollection[jsonPropertyPath as keyof typeof startingCollection];

                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      [`${jsonPropertyPath}`]: existingValue
                    });

                  } else if (collection && !startingCollection) {
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      [`${jsonPropertyPath}`]: []
                    });
                  }
                }
              }}
            />}
        </div>
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
              className='dark:text-white'
            />
          </div>}
        {(permissionDataSource?.hasForbiddenTimes) && updateFlag && !(err) &&
          <div className='' style={{ textAlign: 'center' }}>
            <br />
            {<>
              <WarningOutlined style={{ color: 'orange', fontSize: 16, marginRight: 4 }} />
              <b>Updating certain values may be frozen and disallowed. See permission for more details.</b>
              <br />
            </>}

          </div>}

        {(err) && <><br /><ErrDisplay err={err} /></>}
      </div>
      <span color='black' style={{ margin: 16 }} />

      {!updateFlag &&
        <div style={{ textAlign: 'center' }} className='dark:text-white' >
          <SwitchForm
            options={[{
              title: 'Do Not Update',
              message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager'
                  && jsonPropertyPath !== "defaultUserIncomingApprovals" ? ' For new collections, this means the value will be empty or unset.' : ''}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' ? ' For new collections, this means the manager will be set to your address by default.' : ''}
                  ${existingCollectionId && permissionName == 'defaultUserIncomingApprovals' ? ' This means that users will have to opt-in to all incoming transfers by default.' : ''}
                  `,
              isSelected: true,
            },
            ]}
            onSwitchChange={() => { }}
          />
        </div>}

      {showPermission && jsonPropertyPath !== "defaultUserIncomingApprovals" ? <>
        <InformationDisplayCard title={question}>
          <PermissionDisplay
            permissions={castFunction(prevPermissions)}
            usedFlags={flags as UsedFlags}
            neverHasManager={noManager}
            mintOnly={mintOnly}
            nonMintOnly={nonMintOnly}
          />
        </InformationDisplayCard>
        <br />
      </> : <></>}
      {updateFlag && !customJson && <>
        {node}
      </>}
      {updateFlag && customJson && <>
        <JSONSetter
          setErr={setJsonErr}
          jsonPropertyPath={jsonPropertyPath}
          customValue={customValue}
          customSetValueFunction={customSetValueFunction}
        />
        <br />
        {jsonErr && <ErrDisplay err={jsonErr} />}
      </>}
    </>
  )
}