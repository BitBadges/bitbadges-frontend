import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Divider, StepProps, Typography } from 'antd';
import { BalanceArray, MsgTransferBadges } from 'bitbadgesjs-sdk';
import { CollectionApprovalWithDetails, TransferWithIncrements, convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, fetchAccountsWithOptions, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';

export const getTreeForApproval = (approval: CollectionApprovalWithDetails<bigint>) => {
  const leavesDetails = approval.details?.challengeDetails?.leavesDetails;
  const treeOptions = approval.details?.challengeDetails?.treeOptions;

  return new MerkleTree(leavesDetails?.leaves.map((x) => (leavesDetails?.isHashed ? x : SHA256(x))) ?? [], SHA256, treeOptions);
};

export const getProofDetails = (tree: MerkleTree, leaf: string) => {
  const proofObj = tree?.getProof(leaf);
  const isValidProof = (proofObj && tree && proofObj.length === tree.getLayerCount() - 1) ?? false;

  return { proofObj, isValidProof };
};

export function CreateTxMsgTransferBadgesModal({
  collectionId,
  visible,
  setVisible,
  children,
  defaultAddress,
  approval,
  fromTransferabilityDisplay
}: {
  collectionId: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  children?: React.ReactNode;
  defaultAddress?: string;
  approval?: CollectionApprovalWithDetails<bigint>;
  fromTransferabilityDisplay?: boolean;
}) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);

  const [transfers, setTransfers] = useState<Array<TransferWithIncrements<bigint>>>([]);
  const [sender, setSender] = useState<string>(defaultAddress ?? chain.address);

  const senderAccount = useAccount(sender);
  const senderBalance = collection?.getBadgeBalances(senderAccount?.cosmosAddress ?? '') ?? new BalanceArray<bigint>();

  const approvalCriteria = approval?.approvalCriteria;
  const merkleChallenge = approvalCriteria && approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;

  const tree = useMemo(() => {
    if (INFINITE_LOOP_MODE) console.log('useMemo:  tree');
    if (!visible) return null;
    if (!approval) return null;

    return getTreeForApproval(approval);
  }, [approval, visible]);

  const requiresWhitelistProof = !!(merkleChallenge?.root && merkleChallenge.useCreatorAddressAsLeaf) ?? false;
  const leaf = requiresWhitelistProof ? SHA256(chain.cosmosAddress).toString() : '';

  const { proofObj, isValidProof } = useMemo(() => {
    if (INFINITE_LOOP_MODE) console.log('useMemo:  proofObj');
    if (!visible) return { proofObj: undefined, isValidProof: false };
    if (!approval || !tree) return { proofObj: undefined, isValidProof: false };

    return getProofDetails(tree, leaf);
  }, [tree, leaf, visible, approval]);

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: sender balance ');
    async function getSenderBalance() {
      await fetchAccounts([sender]);
      await fetchBalanceForUser(collectionId, sender);
    }

    const delayDebounceFn = setTimeout(async () => {
      getSenderBalance();
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [sender, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  fetch accounts');
    fetchAccounts(transfers.map((x) => x.toAddresses).flat());
  }, [transfers]);

  const items = [
    //No need to select sender if from is already hardcoded
    approval?.fromList.addresses.length === 1 && approval.fromList.whitelist
      ? undefined
      : {
          title: 'Sender',
          description: (
            <div>
              <InformationDisplayCard
                title="Sender"
                span={24}
                style={{
                  padding: '0',
                  textAlign: 'center',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 20
                }}
                noBorder
                inheritBg>
                <AddressSelect addressOrUsername={(senderAccount?.username || senderAccount?.address) ?? ''} onUserSelect={setSender} allowMintSearch />
                {!fromTransferabilityDisplay && sender === 'Mint' && (
                  <>
                    <Divider />
                    <Typography.Text style={{ color: '#FF5733' }}>
                      <WarningOutlined />{' '}
                      {
                        'Certain features for minting may not be supported using this modal. This could cause your transaction to fail. Please use the Transferability tab to transfer badges from the Mint address.'
                      }
                    </Typography.Text>
                  </>
                )}
                <Divider />
                <Typography.Text className="secondary-text">
                  <InfoCircleOutlined />{' '}
                  {
                    "All transfers must satisfy the collection transferability, the sender's outgoing approvals, and the recipient's incoming approvals (if applicable)."
                  }
                </Typography.Text>
              </InformationDisplayCard>
            </div>
          )
        },
    {
      title: 'Add Transfers',
      description: (
        <div>
          <div className="">
            <TransferSelect
              collectionId={collectionId}
              sender={sender}
              originalSenderBalances={senderBalance}
              setTransfers={setTransfers}
              transfers={transfers}
              plusButton
              showApprovalsMessage
            />
          </div>
        </div>
      ),
      disabled: transfers.length === 0
    }
  ];

  const txsInfo = useMemo(() => {
    const convertedTransfers = transfers.map((x) => {
      return {
        from: senderAccount?.cosmosAddress ?? '',
        balances: x.balances,
        toAddresses: x.toAddresses,
        precalculateBalancesFromApproval: {
          approvalId: '',
          approvalLevel: '',
          approverAddress: ''
        },
        merkleProofs: requiresWhitelistProof
          ? [
              {
                aunts: proofObj
                  ? proofObj.map((proof) => {
                      return {
                        aunt: proof.data.toString('hex'),
                        onRight: proof.position === 'right'
                      };
                    })
                  : [],
                leaf: ''
              }
            ]
          : [],
        memo: '',
        prioritizedApprovals: approval
          ? [
              {
                approvalId: approval?.approvalId ?? '',
                approvalLevel: 'collection',
                approverAddress: ''
              }
            ]
          : [],
        onlyCheckPrioritizedApprovals: false
      };
    });

    const txCosmosMsg = new MsgTransferBadges({
      creator: chain.cosmosAddress,
      collectionId: collectionId,
      transfers: convertedTransfers.map((x) => {
        return {
          ...x,
          toAddresses: x.toAddresses.map((y) => convertToCosmosAddress(y))
        };
      })
    });

    return [
      {
        type: 'MsgTransferBadges',
        msg: txCosmosMsg,
        afterTx: async () => {
          await fetchCollections([collectionId], true);

          const addressesToFetch = [txCosmosMsg.creator, chain.cosmosAddress];
          for (const transfer of txCosmosMsg.transfers) {
            addressesToFetch.push(...transfer.from);
            addressesToFetch.push(...transfer.toAddresses);
          }

          //Anything after the first 10 addresses will not be fetched and they can just refresh the page, if necessary
          const prunedAddresses = [...new Set(addressesToFetch.map((x) => convertToCosmosAddress(x)))].slice(0, 10);
          await fetchAccounts(prunedAddresses, true);
          await fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchSequence: true }], true);
        }
      }
    ];
  }, [chain.cosmosAddress, collectionId, transfers, proofObj, requiresWhitelistProof, senderAccount, approval]);

  const filteredSteps = items.filter((x) => x) as StepProps[];
  return (
    <TxModal
      msgSteps={filteredSteps}
      visible={visible && (isValidProof || !requiresWhitelistProof)}
      disabled={requiresWhitelistProof && !isValidProof}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Transfer Badge(s)"
      width={'90%'}>
      {children}
    </TxModal>
  );
}
