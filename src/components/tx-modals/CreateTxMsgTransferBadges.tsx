import { InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, TransferWithIncrements, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';


export function CreateTxMsgTransferBadgesModal({ collectionId, visible, setVisible, children, defaultAddress, approval, tree }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
  defaultAddress?: string
  approval?: CollectionApprovalWithDetails<bigint>,
  tree?: MerkleTree | null,
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const requiresWhitelistProof = !!(approval && approval.approvalCriteria?.merkleChallenge?.root && approval.approvalCriteria?.merkleChallenge.useCreatorAddressAsLeaf) ?? false;
  const leaf = requiresWhitelistProof ? SHA256(chain.cosmosAddress).toString() : '';
  const proofObj = tree?.getProof(leaf);
  const isValidProof = (proofObj && tree && proofObj.length === tree.getLayerCount() - 1) ?? false;

  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [sender, setSender] = useState<string>(defaultAddress ?? chain.address);

  const senderBalance = collection?.owners.find(x => x.cosmosAddress === accounts.getAccount(sender)?.cosmosAddress)?.balances ?? [];
  const senderAccount = accounts.getAccount(sender);

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: sender balance ');
    async function getSenderBalance() {

      await accounts.fetchAccounts([sender]);

      await collections.fetchBalanceForUser(collectionId, sender);
    }

    const delayDebounceFn = setTimeout(async () => {
      getSenderBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [sender, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  fetch accounts');
    accounts.fetchAccounts(transfers.map(x => x.toAddresses).flat());
  }, [transfers]);

  const convertedTransfers = transfers.map(x => {
    return {
      from: senderAccount?.cosmosAddress ?? '',
      balances: x.balances,
      toAddresses: x.toAddresses,
      precalculateBalancesFromApproval: {
        approvalId: '',
        approvalLevel: '',
        approverAddress: '',
      },
      merkleProofs: requiresWhitelistProof ? [{
        aunts: proofObj ? proofObj.map((proof) => {
          return {
            aunt: proof.data.toString('hex'),
            onRight: proof.position === 'right'
          }
        }) : [],
        leaf: '',
      }] : [],
      memo: '',
      prioritizedApprovals: [],
      onlyCheckPrioritizedApprovals: false,
    }
  })

  const txCosmosMsg: MsgTransferBadges<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    transfers: convertedTransfers.map(x => {
      return {
        ...x,
        toAddresses: x.toAddresses.map(y => convertToCosmosAddress(y)),
      }
    })
  };

  const items = [
    {
      title: 'Sender',
      description: <div>
        <InformationDisplayCard
          title='Sender'
          span={24}
          style={{
            padding: '0',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
          noBorder
          inheritBg
        >
          <AddressSelect
            defaultValue={(senderAccount?.username || senderAccount?.address) ?? ''}
            onUserSelect={setSender}
          />

          <Divider />
          <Typography.Text className='text-gray-400'>
            <InfoCircleOutlined /> {"All transfers must satisfy the collection transferability, and if not overriden by the collection transferability, the transfer must also satisfy the sender's outgoing approvals as well."}
          </Typography.Text>
        </InformationDisplayCard>
      </div >
    },
    {
      title: 'Add Transfers',
      description: <div>


        <div className=''>
          <TransferSelect
            collectionId={collectionId}
            sender={sender}
            originalSenderBalances={senderBalance}
            setTransfers={setTransfers}
            transfers={transfers}
            plusButton
            showApprovalsMessage
          />
        </div >
      </div>,
      disabled: transfers.length === 0
    }
  ];

  return (
    <TxModal
      msgSteps={items}
      visible={visible && (isValidProof || !requiresWhitelistProof)}
      disabled={requiresWhitelistProof && !isValidProof}
      setVisible={setVisible}
      txName="Transfer Badge(s)"
      txCosmosMsg={txCosmosMsg}
      width={'90%'}
      createTxFunction={createTxMsgTransferBadges}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        // await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress, true);
      }}
      requireRegistration
      displayMsg={<div className='dark:text-white'>
        <TransferDisplay

          transfers={convertedTransfers}
          collectionId={collectionId}
          setTransfers={setTransfers}
        />
        <Divider />
      </div>}
    >
      {children}
    </TxModal>
  );
}