import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Divider } from 'antd';
import { Balance, MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { DistributionMethod, TransferWithIncrements } from 'bitbadgesjs-utils';
import React, { useEffect, useRef, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgTransferBadgesModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const accountsRef = useRef(accounts);
  const collectionsRef = useRef(collections);


  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [sender, setSender] = useState<string>(chain.cosmosAddress);
  const [senderBalance, setSenderBalance] = useState<Balance<bigint>[]>([]);

  const senderAccount = accounts.getAccount(sender);

  useEffect(() => {
    setSender(chain.cosmosAddress);
  }, [chain]);

  const DELAY_MS = 500;
  useEffect(() => {
    async function getSenderBalance() {
      const account = await accountsRef.current.fetchAccounts([sender]);
      const senderAccount = account[0];

      const balanceRes = await collectionsRef.current.fetchBalanceForUser(collectionId, senderAccount.cosmosAddress);
      setSenderBalance(balanceRes.balances);
    }

    const delayDebounceFn = setTimeout(async () => {
      getSenderBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [sender, collectionId]);

  useEffect(() => {
    for (const transfer of transfers) {
      accountsRef.current.fetchAccounts(transfer.toAddresses);
    }
  }, [transfers]);

  const txCosmosMsg: MsgTransferBadges<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    transfers: transfers
  };

  const items = [
    {
      title: 'Select Sender',
      description: <div>
        <div
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
                avatar={senderAccount?.avatar}
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

          {senderAccount?.cosmosAddress != chain.cosmosAddress && <div >
            <br />
            <InfoCircleOutlined /> If you select an address other than yours, note that you must be approved to transfer on their behalf.
          </div>}

          <AddressSelect
            defaultValue={senderAccount?.username ?? senderAccount?.address ?? ''}
            onUserSelect={setSender}
          />
        </div>
      </div >
    },
    {
      title: 'Add Transfers',
      description: <div>
        <div className='flex-center'>
          <TransferSelect
            distributionMethod={DistributionMethod.DirectTransfer}
            collectionId={collectionId}
            sender={sender}
            originalSenderBalances={senderBalance}
            setTransfers={setTransfers}
            transfers={transfers}
            plusButton
          />
        </div >
      </div >,
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
      createTxFunction={createTxMsgTransferBadges}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress, true);
      }}
      requireRegistration
      displayMsg={<div className='primary-text'>
        <TransferDisplay
          transfers={transfers}
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