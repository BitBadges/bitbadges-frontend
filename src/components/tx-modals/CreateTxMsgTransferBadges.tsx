import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Divider, Typography } from 'antd';
import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { TransferWithIncrements, convertToCosmosAddress } from 'bitbadgesjs-utils';
import React, { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferBadgesModal({ collectionId, visible, setVisible, children, defaultAddress }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
  defaultAddress?: string
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);



  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [sender, setSender] = useState<string>(defaultAddress ?? chain.address);

  const senderBalance = collection?.owners.find(x => x.cosmosAddress === accounts.getAccount(sender)?.cosmosAddress)?.balances ?? [];

  const senderAccount = accounts.getAccount(sender);

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: sender balance ');
    async function getSenderBalance() {


      const account = await accounts.fetchAccounts([sender]);
      const senderAccount = account[0];

      await collections.fetchBalanceForUser(collectionId, senderAccount.cosmosAddress);
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
      merkleProofs: [],
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
          title=''
          span={24}
          style={{
            padding: '0',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <Avatar
            size={150}
            src={
              <BlockiesAvatar
                avatar={senderAccount?.profilePicUrl ?? senderAccount?.avatar}
                address={senderAccount?.address.toLowerCase() ?? ''}
                fontSize={150}
                shape='circle'
              />
            }
          />

          <div className='flex-center' style={{ marginBottom: 10, marginTop: 4 }}>
            <AddressDisplay
              addressOrUsername={sender}
              hidePortfolioLink
            />
          </div>



          <AddressSelect
            defaultValue={senderAccount?.username ?? senderAccount?.address ?? ''}
            onUserSelect={setSender}
          />

          <Divider />
          <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
            <InfoCircleOutlined /> {"All transfers must satisfy the collection transferability, and if not overriden by the collection transferability, the transfer must also satisfy the sender's outgoing approvals as well."}
          </Typography.Text>
          {/*
          
          <br />
          <br />
          <UserApprovalsTab
            collectionId={collectionId}
            hideSelect
            defaultApprover={sender}
            hideUpdateHistory
            hideIncomingApprovals
            showCollectionApprovals
          /> */}
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
      visible={visible}
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
      displayMsg={<div className='primary-text'>
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