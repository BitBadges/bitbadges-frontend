import { InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { MsgUpdatePermissions, createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import { CanCreateMoreBadgesDigit, CanDeleteDigit, CanManagerBeTransferredDigit, CanUpdateAllowedDigit, CanUpdateBytesDigit, CanUpdateMetadataUrisDigit, GetPermissionNumberValue, GetPermissions, UpdatePermissions } from 'bitbadgesjs-utils';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdatePermissionsModal({ collectionId, visible, setVisible, children, }
  : {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode
  }) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const [currPermissions, setCurrPermissions] = useState<bigint>(collection ? GetPermissionNumberValue(collection.permissions) : 0n);

  const txCosmosMsg: MsgUpdatePermissions<bigint> = {
    creator: chain.cosmosAddress,
    collectionId,
    permissions: currPermissions
  };

  // EXPERIMENTAL STANDARD
  const isOffChainBalances = collection && collection.balancesUri ? true : false;

  const items = [
    {
      title: 'Select Permissions To Update',
      description: <>
        {!isOffChainBalances &&
          <div className='flex-between' style={{ margin: 8 }}>
            Freeze / Unfreeze Addresses (Edit Transferability)
            <div>
              <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                <Switch disabled={!collection?.permissions.CanUpdateAllowed} defaultChecked={GetPermissions(currPermissions).CanUpdateAllowed} onChange={() => {
                  setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateAllowedDigit, !GetPermissions(currPermissions).CanUpdateAllowed))
                }} />
              </Tooltip>
            </div>
          </div>}
        {
          <div className='flex-between' style={{ margin: 8 }}>
            Add More Badges to Collection
            <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
              <Switch disabled={!collection?.permissions.CanCreateMoreBadges} defaultChecked={GetPermissions(currPermissions).CanCreateMoreBadges} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanCreateMoreBadgesDigit, !GetPermissions(currPermissions).CanCreateMoreBadges))
              }} />
            </Tooltip>
          </div>}

        <div className='flex-between' style={{ margin: 8 }}>
          Update Metadata URLs
          <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
            <Switch disabled={!collection?.permissions.CanUpdateMetadataUris} defaultChecked={GetPermissions(currPermissions).CanUpdateMetadataUris} onChange={() => {
              setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateMetadataUrisDigit, !GetPermissions(currPermissions).CanUpdateMetadataUris))
            }} />
          </Tooltip>
        </div>
        {isOffChainBalances &&
          <div className='flex-between' style={{ margin: 8 }}>
            Update Balances
            <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
              <Switch disabled={!collection?.permissions.CanUpdateBytes} defaultChecked={GetPermissions(currPermissions).CanUpdateBytes} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateBytesDigit, !GetPermissions(currPermissions).CanUpdateBytes))
              }} />
            </Tooltip>
          </div>}
        <div className='flex-between' style={{ margin: 8 }}>
          Transfer the Manager Role
          <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
            <Switch disabled={!collection?.permissions.CanManagerBeTransferred} defaultChecked={GetPermissions(currPermissions).CanManagerBeTransferred} onChange={() => {
              setCurrPermissions(UpdatePermissions(currPermissions, CanManagerBeTransferredDigit, !GetPermissions(currPermissions).CanManagerBeTransferred))
            }} />
          </Tooltip>
        </div>
        <div className='flex-between' style={{ margin: 8 }}>
          Delete Collection
          <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
            <Switch disabled={!collection?.permissions.CanDelete} defaultChecked={GetPermissions(currPermissions).CanDelete} onChange={() => {
              setCurrPermissions(UpdatePermissions(currPermissions, CanDeleteDigit, !GetPermissions(currPermissions).CanDelete))
            }} />
          </Tooltip>
        </div>
        <br />
        <InfoCircleOutlined /> Once a permission is turned off, it cannot be turned back on.
        <br />
      </>,
    }
  ]

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Update Permissions"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgUpdatePermissions}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
      }}
    >
      {children}
    </TxModal>
  );
}