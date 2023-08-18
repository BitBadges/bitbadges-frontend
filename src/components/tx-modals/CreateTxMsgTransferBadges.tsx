import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Divider } from 'antd';
import { Balance, MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { DistributionMethod, TransferWithIncrements, convertToCosmosAddress } from 'bitbadgesjs-utils';
import React, { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { TransferSelect } from '../transfers/TransferOrClaimSelect';
import { TxModal } from './TxModal';
import { INFINITE_LOOP_MODE } from '../../constants';

export function CreateTxMsgTransferBadgesModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();




  const [transfers, setTransfers] = useState<TransferWithIncrements<bigint>[]>([]);
  const [sender, setSender] = useState<string>(chain.address);
  const [senderBalance, setSenderBalance] = useState<Balance<bigint>[]>([]);

  const senderAccount = accounts.getAccount(sender);

  const DELAY_MS = 500;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: sender balance ');
    async function getSenderBalance() {
      const account = await accounts.fetchAccounts([sender]);
      const senderAccount = account[0];

      const balanceRes = await collections.fetchBalanceForUser(collectionId, senderAccount.cosmosAddress);
      setSenderBalance(balanceRes.balances);
    }

    const delayDebounceFn = setTimeout(async () => {
      getSenderBalance();
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [sender, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  fetch accounts');
    for (const transfer of transfers) {
      accounts.fetchAccounts(transfer.toAddresses);
    }
  }, [transfers]);

  const convertedTransfers = transfers.map(x => {
    return {
      from: senderAccount?.cosmosAddress ?? '',
      balances: x.balances,
      toAddresses: x.toAddresses,
      precalculationDetails: {
        approvalId: '',
        approvalLevel: '',
        approverAddress: '',
      },
      merkleProofs: [],
      memo: '',
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
        </div>
      </div >
    },
    {
      title: 'Add Transfers',
      description: <div>
        {<div className=''>
          <br />
          <InfoCircleOutlined /> {"Note all transfers must be approved by a) the collection and b) the sender's and recipient's incoming / outgoing approvals."}
        </div>}
        <br />

        <div className=''>
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