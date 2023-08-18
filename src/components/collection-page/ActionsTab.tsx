import { Card, Empty, notification } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgDeleteCollectionModal } from '../tx-modals/CreateTxMsgDeleteCollectionModal';
import { CreateTxMsgTransferBadgesModal } from '../tx-modals/CreateTxMsgTransferBadges';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';

export function ActionsTab({
  collectionId,
  badgeView
}: {
  collectionId: bigint,
  badgeView?: boolean;
}) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  //Modal visibilities
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [deleteIsVisible, setDeleteIsVisible] = useState(false);
  const [approveIsVisible, setApproveIsVisible] = useState(false);

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

    actions.push({
      title: getTitleElem("Approve"),
      description: getDescriptionElem(
        "Update your incoming and outgoing approvals."
      ),
      showModal: () => {
        setApproveIsVisible(!approveIsVisible);
      }
    });
  }

  actions.push({
    title: getTitleElem(isOffChainBalances ? "Refresh Metadata / Balances" : "Refresh Metadata"),
    description: getDescriptionElem(
      "Refetch the " + (isOffChainBalances ? "balances and " : "") + "metadata of this collection."
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

  if (isManager && !badgeView) {
    actions.push({
      title: getTitleElem("Update Collection"),
      description: getDescriptionElem(
        "Update the details of this collection."
      ),
      showModal: () => {
        router.push('/collections/update/' + collectionId);
      },
    });



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
          <div className='primary-text flex-center flex-wrap'
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
            })}
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
