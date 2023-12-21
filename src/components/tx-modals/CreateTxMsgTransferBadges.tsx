import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, TransferWithIncrements, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';


export function CreateTxMsgTransferBadgesModal({ collectionId, visible, setVisible, children, defaultAddress, approval, fromTransferabilityRow }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
  defaultAddress?: string
  approval?: CollectionApprovalWithDetails<bigint>,
  fromTransferabilityRow?: boolean
}) {
  const chain = useChainContext();

  const approvalCriteria = approval?.approvalCriteria;
  const merkleChallenge = approval?.approvalCriteria && approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;
  const leavesDetails = approval?.details?.challengeDetails?.leavesDetails;
  const treeOptions = approval?.details?.challengeDetails?.treeOptions;



  const [tree, setTree] = useState<MerkleTree | null>(merkleChallenge ?
    new MerkleTree(leavesDetails?.leaves.map(x => leavesDetails?.isHashed ? x : SHA256(x)) ?? [], SHA256, treeOptions) : null);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  tree');
    if (merkleChallenge) {
      const tree = new MerkleTree(approval?.details?.challengeDetails?.leavesDetails?.leaves.map(x => {
        return approval?.details?.challengeDetails?.leavesDetails?.isHashed ? x : SHA256(x);
      }) ?? [], SHA256, approval?.details?.challengeDetails?.treeOptions);
      setTree(tree);
    }
  }, [approval, merkleChallenge]);


  const collection = useCollection(collectionId);

  const requiresWhitelistProof = !!(approval && approval.approvalCriteria?.merkleChallenge?.root && approval.approvalCriteria?.merkleChallenge.useCreatorAddressAsLeaf) ?? false;
  const leaf = requiresWhitelistProof ? SHA256(chain.cosmosAddress).toString() : '';
  const proofObj = tree?.getProof(leaf);
  const isValidProof = (proofObj && tree && proofObj.length === tree.getLayerCount() - 1) ?? false;

  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [sender, setSender] = useState<string>(defaultAddress ?? chain.address);
  const senderAccount = useAccount(sender);
  const senderBalance = collection?.owners.find(x => x.cosmosAddress === senderAccount?.cosmosAddress)?.balances ?? [];


  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: sender balance ');
    async function getSenderBalance() {

      await fetchAccounts([sender]);

      await fetchBalanceForUser(collectionId, sender);
    }

    const delayDebounceFn = setTimeout(async () => {
      getSenderBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [sender, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  fetch accounts');
    fetchAccounts(transfers.map(x => x.toAddresses).flat());
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
            allowMintSearch
          />
          {!fromTransferabilityRow && sender === 'Mint' && <>
            <Divider />
            <Typography.Text style={{ color: '#FF5733' }} >
              <WarningOutlined /> {"Certain features for minting may not be supported using this modal. This could cause your transaction to fail. Please use the Transferability tab to transfer badges from the Mint address."}
            </Typography.Text>
          </>}
          <Divider />
          <Typography.Text className='secondary-text'>
            <InfoCircleOutlined /> {"All transfers must satisfy the collection transferability, the sender's outgoing approvals, and the recipient's incoming approvals (if applicable)."}
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
        await fetchCollections([collectionId], true);
        // await fetchBalanceForUser(collectionId, chain.cosmosAddress, true);
      }}
      requireRegistration
    // displayMsg={<div className='primary-text'>
    //   <TransferDisplay

    //     transfers={convertedTransfers}
    //     collectionId={collectionId}
    //     setTransfers={setTransfers}
    //   />
    //   <Divider />
    // </div>}
    >
      {children}
    </TxModal>
  );
}