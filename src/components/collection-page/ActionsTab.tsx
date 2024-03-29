import { Card, Empty } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { areBalancesBitBadgesHosted } from '../../bitbadges-api/utils/balances';
import { getMintApprovals } from '../../bitbadges-api/utils/mintVsNonMint';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgDeleteCollectionModal } from '../tx-modals/CreateTxMsgDeleteCollectionModal';
import { CreateTxMsgTransferBadgesModal } from '../tx-modals/CreateTxMsgTransferBadges';
import { CreateTxMsgUpdateUserIncomingApprovalsModal } from '../tx-modals/CreateTxMsgUpdateUserIncomingApprovals';
import { CreateTxMsgUpdateUserOutgoingApprovalsModal } from '../tx-modals/CreateTxMsgUpdateUserOutgoingApprovals';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';
import { RefreshModal } from '../tx-modals/RefreshModal';
import { UpdateBalancesModal } from '../tx-modals/UpdateBalancesModal';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';

export interface Action {
  title: string;
  description: string;
  showModal: () => void;
  disabled?: boolean;
}

const getTitleElem = (title: string) => {
  return <div className="primary-text">{title}</div>;
};

const getDescriptionElem = (description: string) => {
  return <div className="secondary-text">{description}</div>;
};

export function ActionCard({ action }: { action: Action }) {
  const title = getTitleElem(action.title);
  const description = getDescriptionElem(action.description);

  return (
    <Card
      className="primary-text card-bg flex-center card-border"
      style={{
        width: '300px',
        minHeight: '150px',
        margin: 8,
        textAlign: 'center',
        cursor: action.disabled ? 'not-allowed' : undefined
      }}
      hoverable={!action.disabled}
      onClick={async () => {
        if (action.disabled) return;
        action.showModal();
      }}>
      <Meta
        title={
          <div
            className="primary-text"
            style={{
              fontSize: 20,
              fontWeight: 'bolder'
            }}>
            {title}
          </div>
        }
        description={<div className="secondary-text flex-center full-width">{description}</div>}
      />
    </Card>
  );
}

export function ActionsTab({ collectionId, badgeView }: { collectionId: bigint; badgeView?: boolean }) {
  const chain = useChainContext();
  const router = useRouter();

  const collection = useCollection(collectionId);

  //Modal visibilities
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [deleteIsVisible, setDeleteIsVisible] = useState(false);
  const [approveIsVisible, setApproveIsVisible] = useState(false);
  const [outgoingApproveIsVisible, setOutgoingApproveIsVisible] = useState(false);
  const [distributeCodesIsVisible, setDistributeCodesIsVisible] = useState(false);
  const [updateBalancesIsVisible, setUpdateBalancesIsVisible] = useState(false);
  const [refreshModalIsVisible, setRefreshModalIsVisible] = useState(false);

  const actions: Action[] = [];

  const isBitBadgesHosted = areBalancesBitBadgesHosted(collection);
  const isManager = collection && collection.getManager() === chain.cosmosAddress && chain.cosmosAddress;
  const isOffChainIndexedBalances = collection && collection.balancesType == 'Off-Chain - Indexed' ? true : false;
  const isOnChainBalances = collection && collection.balancesType == 'Standard';
  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');

  if (isOnChainBalances && !noBalancesStandard) {
    actions.push({
      title: 'Transfer',
      description: 'Transfer badge(s) in this collection, if allowed.',
      showModal: () => {
        setTransferIsVisible(!transferIsVisible);
      }
    });

    actions.push({
      title: 'Set Incoming Approvals',
      description: 'Update your incoming approvals.',
      showModal: () => {
        setApproveIsVisible(!approveIsVisible);
      }
    });

    actions.push({
      title: 'Set Outgoing Approvals',
      description: 'Update your outgoing approvals.',
      showModal: () => {
        setOutgoingApproveIsVisible(!outgoingApproveIsVisible);
      }
    });
  }

  actions.push({
    title: 'Refresh',
    description: 'Refetch the ' + (isOffChainIndexedBalances ? 'balances and ' : '') + 'metadata of this collection.',
    showModal: async () => {
      setRefreshModalIsVisible(!refreshModalIsVisible);
    }
  });

  if (isManager && !badgeView) {
    actions.push({
      title: 'Update Collection',
      description: 'Update the details of this collection on the blockchain.',
      showModal: () => {
        router.push('/update/' + collectionId);
      }
    });

    if (isBitBadgesHosted) {
      actions.push({
        title: 'Update Balances',
        description: 'Update the balances of this collection. No blockchain transaction required.',
        showModal: () => {
          setUpdateBalancesIsVisible(!updateBalancesIsVisible);
        }
      });
    }

    if (
      getMintApprovals(collection).find(
        (x) => x.approvalCriteria?.merkleChallenge?.root && !x.approvalCriteria?.merkleChallenge.useCreatorAddressAsLeaf
      )
    ) {
      actions.push({
        title: 'Distribute Codes',
        description: 'Distribute the claim codes / passwords so users can receive these badges!',
        showModal: () => {
          setDistributeCodesIsVisible(!distributeCodesIsVisible);
        }
      });
    }

    if (collection.collectionPermissions.canDeleteCollection.length == 0) {
      actions.push({
        title: 'Delete Collection',
        description: 'Delete this collection.',
        showModal: () => {
          setDeleteIsVisible(!deleteIsVisible);
        }
      });
    }
  }

  if (!chain.connected) {
    return (
      <div>
        <BlockinDisplay />
      </div>
    );
  }

  return (
    <RegisteredWrapper
      node={
        <div className="full-width" style={{ fontSize: 20 }}>
          <div
            className="primary-text flex-center flex-wrap"
            style={{
              padding: '0',
              textAlign: 'center',
              marginTop: 20
            }}>
            {actions.map((action, idx) => {
              return <ActionCard key={idx} action={action} />;
            })}
          </div>
          {actions.length == 0 && (
            <>
              <Empty className="primary-text" description="No actions can be taken." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </>
          )}

          {transferIsVisible && (
            <CreateTxMsgTransferBadgesModal visible={transferIsVisible} setVisible={setTransferIsVisible} collectionId={collectionId} />
          )}

          {approveIsVisible && (
            <CreateTxMsgUpdateUserIncomingApprovalsModal visible={approveIsVisible} setVisible={setApproveIsVisible} collectionId={collectionId} />
          )}

          {deleteIsVisible && (
            <CreateTxMsgDeleteCollectionModal visible={deleteIsVisible} setVisible={setDeleteIsVisible} collectionId={collectionId} />
          )}

          {outgoingApproveIsVisible && (
            <CreateTxMsgUpdateUserOutgoingApprovalsModal
              visible={outgoingApproveIsVisible}
              setVisible={setOutgoingApproveIsVisible}
              collectionId={collectionId}
            />
          )}

          {distributeCodesIsVisible && (
            <FetchCodesModal visible={distributeCodesIsVisible} setVisible={setDistributeCodesIsVisible} collectionId={collectionId} />
          )}

          {updateBalancesIsVisible && (
            <UpdateBalancesModal visible={updateBalancesIsVisible} setVisible={setUpdateBalancesIsVisible} collectionId={collectionId} />
          )}

          {refreshModalIsVisible && (
            <RefreshModal visible={refreshModalIsVisible} setVisible={setRefreshModalIsVisible} collectionId={collectionId} />
          )}
        </div>
      }
    />
  );
}
