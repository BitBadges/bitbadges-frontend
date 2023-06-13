import { Card, Empty, message } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgDeleteCollectionModal } from '../tx-modals/CreateTxMsgDeleteCollectionModal';
import { CreateTxMsgMintAndDistributeBadgesModal } from '../tx-modals/CreateTxMsgMintAndDistributeBadgesModal';
import { CreateTxMsgRequestTransferManagerModal } from '../tx-modals/CreateTxMsgRequestTransferManagerModal';
import { CreateTxMsgTransferBadgeModal } from '../tx-modals/CreateTxMsgTransferBadge';
import { CreateTxMsgTransferManagerModal } from '../tx-modals/CreateTxMsgTransferManagerModal';
import { CreateTxMsgUpdateBalancesModal } from '../tx-modals/CreateTxMsgUpdateBalancesModal';
import { CreateTxMsgUpdateAllowedTransfersModal } from '../tx-modals/CreateTxMsgUpdateAllowedTransfers';
import { CreateTxMsgUpdatePermissionsModal } from '../tx-modals/CreateTxMsgUpdatePermissions';
import { CreateTxMsgUpdateUrisModal } from '../tx-modals/CreateTxMsgUpdateUrisModal';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';

export function ActionsTab({
  collectionId,
  badgeView
}: {
  collectionId: bigint,
  badgeView?: boolean;
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  //Modal visibilities
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [transferManagerIsVisible, setTransferManagerIsVisible] = useState(false);
  const [updatePermissionsIsVisible, setUpdatePermissionsIsVisible] = useState(false);
  const [distributeIsVisible, setDistributeIsVisible] = useState(false);
  const [addBadgesIsVisible, setAddBadgesIsVisible] = useState(false);
  const [updateMetadataIsVisible, setUpdateMetadataIsVisible] = useState(false);
  const [requestTransferManagerIsVisible, setRequestTransferManagerIsVisible] = useState(false);
  const [updateAllowedIsVisible, setUpdateAllowedIsVisible] = useState(false);
  const [deleteIsVisible, setDeleteIsVisible] = useState(false);
  const [updateUserBalancesIsVisible, setUpdateUserBalancesIsVisible] = useState(false);

  const actions: {
    title: React.ReactNode,
    description: React.ReactNode,
    showModal: () => void,
    disabled?: boolean
  }[] = [];

  const isManager = collection && collection.managerInfo.cosmosAddress === chain.cosmosAddress;
  const isOffChainBalances = collection && collection.balancesUri ? true : false;
  const isOnChainBalances = collection && !collection.balancesUri;

  const getTitleElem = (title: string) => {
    return (
      <div className='primary-text'>
        {title}
      </div>
    );
  };

  const getDescriptionElem = (description: string) => {
    return (
      <div className='secondary-text'>
        {description}
      </div>
    );
  };



  if (isOnChainBalances) {
    actions.push({
      title: getTitleElem("Transfer"),
      description: getDescriptionElem(
        "Transfer badge(s) in this collection, if allowed."
      ),
      showModal: () => {
        setTransferIsVisible(!transferIsVisible);
      },
    });
  }

  if (isManager && !badgeView) {
    if (collection.permissions.CanUpdateBalancesUri && isOffChainBalances) {
      actions.push({
        title: getTitleElem("Update Balances"),
        description: getDescriptionElem(
          "Update the owners of this badge."
        ),
        showModal: () => {
          setUpdateUserBalancesIsVisible(!updateUserBalancesIsVisible);
        },
      });
    }

    if (collection.permissions.CanCreateMoreBadges) {
      actions.push({
        title: getTitleElem("Add Badges"),
        description: getDescriptionElem(
          "Add new badges to the collection."
        ),
        showModal: () => {
          setAddBadgesIsVisible(!addBadgesIsVisible);
        },
      });
    }

    if (isOnChainBalances && collection.unmintedSupplys.length > 0) {
      actions.push({
        title: getTitleElem("Distribute Badges"),
        description: getDescriptionElem(
          "Distribute badges that are currently unminted."
        ),
        showModal: () => {
          setDistributeIsVisible(!distributeIsVisible);
        },
      });
    }

    if (collection.permissions.CanUpdateMetadataUris) {
      actions.push({
        title: getTitleElem("Update Metadata"),
        description: getDescriptionElem(
          "Update the metadata of this collection and badges."
        ),
        showModal: () => {
          setUpdateMetadataIsVisible(!updateMetadataIsVisible);
        },
      });
    }

    if (collection.permissions.CanUpdateAllowed) {
      actions.push({
        title: getTitleElem("Edit Transferability"),
        description: getDescriptionElem(
          "Freeze or unfreeze if badge owners able to transfer."
        ),
        showModal: () => {
          setUpdateAllowedIsVisible(!updateAllowedIsVisible);
        },
      });
    }

    if (collection.permissions.CanManagerBeTransferred) {
      actions.push({
        title: getTitleElem("Transfer Manager"),
        description: getDescriptionElem(
          "Transfer manager privileges to new address"
        ),
        showModal: () => {
          setTransferManagerIsVisible(!transferManagerIsVisible);
        },
      });
    }


    actions.push({
      title: getTitleElem("Update Permissions"),
      description: getDescriptionElem(
        "Update the permissions of this collection."
      ),
      showModal: () => {
        setUpdatePermissionsIsVisible(!updatePermissionsIsVisible);
      },
    })

    actions.push({
      title: getTitleElem("Refresh Metadata"),
      description: getDescriptionElem(
        "Perform a forceful refresh for all metadata for this collection."
      ),
      showModal: async () => {
        try {
          await collections.triggerMetadataRefresh(collectionId);
          message.success("Added to the refresh queue! It may take awhile for the refresh to be processed. Please check back later.");
        } catch (e) {
          message.error("Oops! Something went wrong. Please try again later.");
        }
      },
    })

    if (collection.permissions.CanDelete) {
      actions.push({
        title: getTitleElem("Delete Collection"),
        description: getDescriptionElem(
          "Delete this collection."
        ),
        showModal: () => {
          setDeleteIsVisible(!deleteIsVisible);
        },
      });
    }
  }

  if (!isManager && !badgeView) {
    if (collection?.permissions.CanManagerBeTransferred) {
      actions.push({
        title: getTitleElem("Request Manager Transfer"),
        description: getDescriptionElem(
          "Request to become the manager of this collection."
        ),
        showModal: () => {
          setRequestTransferManagerIsVisible(!requestTransferManagerIsVisible);
        },
      })
    }
  }

  if (!chain.connected) {
    return <div>
      <BlockinDisplay />
    </div>
  }

  return (
    <RegisteredWrapper
      node={
        <div className='full-width' style={{ fontSize: 20 }}>
          <div className='primary-text flex-center'
            style={{
              padding: '0',
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            {actions.map((action, idx) => {
              return <Card
                key={idx}
                className='primary-text primary-blue-bg flex-center'
                style={{
                  width: '300px',
                  minHeight: '150px',
                  margin: 8,
                  textAlign: 'center',
                  cursor: action.disabled ? 'not-allowed' : undefined,
                }}
                hoverable={!action.disabled}
                onClick={async () => {
                  if (action.disabled) return;
                  action.showModal();
                }}
              >
                <Meta
                  title={
                    <div
                      className='primary-text'
                      style={{
                        fontSize: 20,
                        fontWeight: 'bolder',
                      }}
                    >
                      {action.title}
                    </div>
                  }
                  description={
                    <div className='secondary-text flex-center full-width'>
                      {action.description}
                    </div>
                  }
                />
              </Card>

            })
            }
          </div>
          {actions.length == 0 && (
            <>
              <Empty
                className='primary-text'
                description="No actions can be taken."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </>
          )}
          {addBadgesIsVisible &&
            <CreateTxMsgMintAndDistributeBadgesModal
              visible={addBadgesIsVisible}
              setVisible={setAddBadgesIsVisible}
              txType='AddBadges'
              collectionId={collectionId}
            />}

          {distributeIsVisible &&
            <CreateTxMsgMintAndDistributeBadgesModal
              visible={distributeIsVisible}
              setVisible={setDistributeIsVisible}
              txType='DistributeBadges'
              collectionId={collectionId}
            />}

          {updateMetadataIsVisible &&
            <CreateTxMsgUpdateUrisModal
              visible={updateMetadataIsVisible}
              setVisible={setUpdateMetadataIsVisible}
              collectionId={collectionId}
            />}

          {transferIsVisible &&
            <CreateTxMsgTransferBadgeModal
              visible={transferIsVisible}
              setVisible={setTransferIsVisible}
              collectionId={collectionId}
            />}

          {transferManagerIsVisible &&
            <CreateTxMsgTransferManagerModal
              visible={transferManagerIsVisible}
              setVisible={setTransferManagerIsVisible}
              collectionId={collectionId}
            />}

          {requestTransferManagerIsVisible &&
            <CreateTxMsgRequestTransferManagerModal
              visible={requestTransferManagerIsVisible}
              setVisible={setRequestTransferManagerIsVisible}
              collectionId={collectionId}
            />}

          {updatePermissionsIsVisible &&
            <CreateTxMsgUpdatePermissionsModal
              visible={updatePermissionsIsVisible}
              setVisible={setUpdatePermissionsIsVisible}
              collectionId={collectionId}
            />}

          {updateAllowedIsVisible &&
            <CreateTxMsgUpdateAllowedTransfersModal
              visible={updateAllowedIsVisible}
              setVisible={setUpdateAllowedIsVisible}
              collectionId={collectionId}
            />}

          {deleteIsVisible &&
            <CreateTxMsgDeleteCollectionModal
              visible={deleteIsVisible}
              setVisible={setDeleteIsVisible}
              collectionId={collectionId}
            />}

          {updateUserBalancesIsVisible &&
            <CreateTxMsgUpdateBalancesModal
              visible={updateUserBalancesIsVisible}
              setVisible={setUpdateUserBalancesIsVisible}
              collectionId={collectionId}
            />}
        </div >
      }
    />
  );
}
