import { AuditOutlined, CodeOutlined, FormOutlined, MinusOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { DEV_MODE } from '../../../constants';
import { PermissionDisplay, getPermissionDetails } from '../../collection-page/PermissionsInfo';
import IconButton from '../../display/IconButton';
import { JSONSetter } from './CustomJSONSetter';
import { SwitchForm } from './SwitchForm';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';

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
      case 'canUpdateCollectionApprovals':
        castFunction = castCollectionApprovalPermissionToUniversalPermission;
        flags = ApprovalPermissionUsedFlags;
        break;
    }
  }

  const permissionDataSource = jsonPropertyPath === "defaultUserIncomingApprovals" ? undefined : getPermissionDetails(
    castFunction(startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions] ?? []),
    flags as any
  );

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


          {updateFlag && jsonPropertyPath !== "defaultUserIncomingApprovals" &&
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
          {updateFlag && !customJson && !disableJson && !onlyShowJson &&
            <IconButton
              src={<CodeOutlined style={{ fontSize: 16 }} />}
              style={{ cursor: 'pointer' }}
              tooltipMessage={'Custom JSON (Advanced Option)'}
              text={'JSON'}
              onClick={() => {
                setCustomJson(true);
              }}
            />}
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
            />}
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
      <span color='black' style={{ margin: 16, }} />

      {!updateFlag &&
        <div style={{ textAlign: 'center' }} className='primary-text flex-center flex-column' >
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
        </InformationDisplayCard>
        <br />
      </> : <></>}
      {updateFlag && !customJson && <>
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