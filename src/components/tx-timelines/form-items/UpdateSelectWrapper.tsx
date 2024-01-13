import { AuditOutlined, BookOutlined, FormOutlined, MinusOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { useEffect, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { getDetailsForCollectionPermission } from '../../../bitbadges-api/utils/permissions';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { compareObjects } from '../../../utils/compare';
import { PermissionDisplayTable, PermissionNameString } from '../../collection-page/PermissionsInfo';
import { ErrDisplay } from '../../common/ErrDisplay';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { getPermissionVariablesFromName } from './BeforeAfterPermission';
import { SwitchForm } from './SwitchForm';

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
  customRevertFunction,
  onlyShowJson = false,
  err,
  setErr,
  documentationLink,
  advancedNode,
  doNotUpdateNode
}: {
  setUpdateFlag: (val: boolean) => void,
  updateFlag: boolean,
  node: () => JSX.Element,
  jsonPropertyPath: string,
  permissionName?: PermissionNameString,
  mintOnly?: boolean,
  disableUndo?: boolean,
  nonMintOnly?: boolean,
  disableJson?: boolean,
  customRevertFunction?: () => void,
  onlyShowJson?: boolean,
  err: Error | null,
  setErr: (err: Error | null) => void,
  documentationLink?: string,
  advancedNode?: () => JSX.Element,
  doNotUpdateNode?: () => JSX.Element,
}) {

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const collection = useCollection(NEW_COLLECTION_ID);
  const existingCollectionId = txTimelineContext.existingCollectionId
  const isMint = !existingCollectionId

  const [customJson, setCustomJson] = useState<boolean>(onlyShowJson);
  const [showPermission, setShowPermission] = useState<boolean>(false);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const { question, validateFunction } = permissionName ? getPermissionVariablesFromName(permissionName) : { question: '', validateFunction: undefined };


  const nonStandardUpdateSelect = jsonPropertyPath === "defaultUserIncomingApprovals" || !jsonPropertyPath

  const prevPermissions = startingCollection?.collectionPermissions[`${permissionName}` as keyof typeof startingCollection.collectionPermissions]
  const noManager = collection ? neverHasManager(collection) : true;
  const permissionDataSource = nonStandardUpdateSelect ? undefined : getDetailsForCollectionPermission(startingCollection, permissionName as PermissionNameString); //Cast bc we only use when path is "defaultUserIncomingApprovals"
  const currValue = collection ? collection[jsonPropertyPath as keyof typeof collection] : undefined;
  const startingValue = startingCollection ? startingCollection[jsonPropertyPath as keyof typeof startingCollection] : undefined;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update select wrapper: ', jsonPropertyPath);
    let validateErr: Error | null = null;
    if (validateFunction && startingValue !== undefined && currValue !== undefined) {
      validateErr = validateFunction(startingValue, currValue, prevPermissions);
      setErr(validateErr);
    }
  }, [currValue, startingValue, prevPermissions, permissionName, jsonPropertyPath, setErr, validateFunction])

  useEffect(() => {
    setCustomJson(onlyShowJson);
  }, [onlyShowJson])




  return (
    <>
      <div className='primary-text flex-center flex-column' >
        <div style={{ alignItems: 'center' }} className='flex-center flex-wrap full-width'>
          {!!existingCollectionId && updateFlag && nonStandardUpdateSelect &&
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
          {updateFlag && !!advancedNode &&
            <IconButton
              src={<FormOutlined style={{ fontSize: 16 }} />}
              text={!showAdvanced ? 'Advanced' : 'Normal'}
              tooltipMessage={!showAdvanced ? 'Go to advanced view' : 'Go to normal view'}
              onClick={() => {
                setShowAdvanced(!showAdvanced);
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

          {updateFlag && (!disableUndo || customRevertFunction) &&
            <IconButton
              src={<UndoOutlined style={{ fontSize: 16 }} />}
              tooltipMessage={'Undo changes'}
              disabled={!customRevertFunction && compareObjects(startingValue, currValue)}
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
          <IconButton
            src={<BookOutlined style={{ fontSize: 16 }} />}
            style={{ cursor: 'pointer' }}
            tooltipMessage={'Visit the BitBadges documentation to learn more about this concept.'}
            text={'Docs'}
            onClick={() => {
              window.open(documentationLink ?? `https://docs.bitbadges.io`, '_blank');
            }}
          />
        </div>
        {!isMint &&
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <Switch
              checkedChildren="Update"
              unCheckedChildren="Do Not Update"
              checked={updateFlag}
              onChange={(e) => {
                setUpdateFlag(e);
              }}
              className='primary-text'
            />
            <br />
          </div>}
        {(permissionDataSource?.hasPermanentlyForbiddenTimes) && updateFlag && !(err) &&
          <div className='secondary-text' style={{ textAlign: 'center' }}>
            <br />
            {<>
              <WarningOutlined style={{ color: '#FF5733', fontSize: 16, marginRight: 4 }} />
              <b>Updating certain values may be frozen and disallowed. See permission for more details.</b>
              <br />
            </>}

          </div>}

        {(err) && <><br /><ErrDisplay err={err} /></>}
      </div >

      {!updateFlag &&
        <div style={{ textAlign: 'center' }} className='primary-text' >
          <SwitchForm
            options={[{
              title: 'Do Not Update',
              message: `This value will remain as previously set.
                  ${!existingCollectionId && permissionName != 'canUpdateManager'
                  && nonStandardUpdateSelect ? ' For new collections, this means the value will be empty or unset.' : ''}
                  ${!existingCollectionId && permissionName == 'canUpdateManager' ? ' For new collections, this means the manager will be set to your address by default.' : ''}
                  ${existingCollectionId && nonStandardUpdateSelect ? ' This means that users will have to opt-in to all incoming transfers by default.' : ''}
                  `,
              isSelected: true,
              additionalNode: doNotUpdateNode
            },
            ]}
            onSwitchChange={() => { }}
          />
          <br />
        </div>
      }

      {
        showPermission && nonStandardUpdateSelect ? <>
          <InformationDisplayCard title={question}>
            <PermissionDisplayTable
              permissions={prevPermissions ?? []}
              permissionName={permissionName as PermissionNameString} //Cast bc we only use when path is "defaultUserIncomingApprovals"
              neverHasManager={noManager}
              mintOnly={mintOnly}
              nonMintOnly={nonMintOnly}
            />
          </InformationDisplayCard>
          <br />
        </> : <></>
      }
      {
        updateFlag && !customJson && !showAdvanced && <>
          {node()}
        </>
      }
      {
        updateFlag && !customJson && showAdvanced && <>
          {advancedNode?.()}
        </>
      }
    </>
  )
}