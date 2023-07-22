import { Card, Empty, notification } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgDeleteCollectionModal } from '../tx-modals/CreateTxMsgDeleteCollectionModal';
import { CreateTxMsgTransferBadgesModal } from '../tx-modals/CreateTxMsgTransferBadges';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';
import { CreateTxMsgUpdateCollectionModal } from '../tx-modals/CreateTxMsgUpdateCollection';

export function ActionsTab({
  collectionId,
  badgeView
}: {
  collectionId: bigint,
  badgeView?: boolean;
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  //Modal visibilities
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [updateMetadataIsVisible, setUpdateMetadataIsVisible] = useState(false);
  const [deleteIsVisible, setDeleteIsVisible] = useState(false);
  const [updateCollectionIsVisible, setUpdateCollectionIsVisible] = useState(false);

  const actions: {
    title: React.ReactNode,
    description: React.ReactNode,
    showModal: () => void,
    disabled?: boolean
  }[] = [];

  const isManager = collection && collection.managerInfo.cosmosAddress === chain.cosmosAddress;
  const isOffChainBalances = collection && collection.balancesType == "Off-Chain" ? true : false;
  const isOnChainBalances = collection && collection.balancesType == "Standard";

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

  //TODO: Only show if transferable
  if (isOnChainBalances) {
    actions.push({
      title: getTitleElem("Transfer"),
      description: getDescriptionElem(
        "Transfer badge(s) in this collection, if approved to do so."
      ),
      showModal: () => {
        setTransferIsVisible(!transferIsVisible);
      },
    });
  }

  if (isManager && !badgeView) {
    actions.push({
      title: getTitleElem("Update Collection"),
      description: getDescriptionElem(
        "Update the details of this collection."
      ),
      showModal: () => {
        setUpdateMetadataIsVisible(!updateMetadataIsVisible);
      },
    });

    actions.push({
      title: getTitleElem(isOffChainBalances ? "Refresh Metadata and Balances" : "Refresh Metadata"),
      description: getDescriptionElem(
        "Refetch all " + (isOffChainBalances ? "balances and " : "") + "metadata of this collection from their sources."
      ),
      showModal: async () => {
        try {
          await collections.triggerMetadataRefresh(collectionId);
          notification.success({ message: "Added to the refresh queue! It may take awhile for the refresh to be processed. Please check back later." });
        } catch (e) {
          console.error(e);
          notification.error({ message: "Oops! Something went wrong. Please try again later." });
        }
      },
    })

    if (collection.collectionPermissions.canDeleteCollection.length == 0) {
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
          {updateCollectionIsVisible &&
            <CreateTxMsgUpdateCollectionModal
              visible={updateCollectionIsVisible}
              setVisible={setUpdateCollectionIsVisible}
              // txType='UpdateCollection'
              collectionId={collectionId}
            />
          }

          {transferIsVisible &&
            <CreateTxMsgTransferBadgesModal
              visible={transferIsVisible}
              setVisible={setTransferIsVisible}
              collectionId={collectionId}
            />}

          {deleteIsVisible &&
            <CreateTxMsgDeleteCollectionModal
              visible={deleteIsVisible}
              setVisible={setDeleteIsVisible}
              collectionId={collectionId}
            />}
        </div >
      }
    />
  );
}
