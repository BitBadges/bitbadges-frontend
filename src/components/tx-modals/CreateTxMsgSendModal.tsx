import { InputNumber } from 'antd';
import { MsgSend, createTxMsgSend } from 'bitbadgesjs-proto';
import React, { useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgSendModal({ visible, setVisible, children,
}: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const signedInAccount = accounts.getAccount(chain.address);

  const [currUserInfo, setCurrUserInfo] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<number>(0);

  const msgSend: MsgSend<bigint> = {
    destinationAddress: accounts.getAccount(currUserInfo)?.cosmosAddress ?? '',
    amount: BigInt(sendAmount),
    denom: 'badge'
  }

  const msgSteps = [
    {
      title: 'Select Recipient',
      description: <div style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AddressSelect onUserSelect={setCurrUserInfo} />
        <br />
        <AddressDisplay addressOrUsername={currUserInfo} />
      </div>,
      disabled: !accounts.getAccount(currUserInfo)
    },
    {
      title: 'Select Amount',
      description: <div className='flex-center flex-column'>
        <b>$BADGE to Send</b>
        <InputNumber
          value={sendAmount}
          onChange={(e) => {
            
            setSendAmount(e ?? 0n);
          }}
          className='primary-text primary-blue-bg'
          min={0}
        // max={signedInAccount?.balance?.amount.toString() ? Numberify(signedInAccount?.balance?.amount.toString()) : 0}
        />
        <br />
        <b>Current Balance: {`${signedInAccount?.balance?.amount}`} $BADGE</b>
      </div>,
      disabled: sendAmount <= 0
    }
  ];


  return (
    <TxModal
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txName="Send $BADGE"
      txCosmosMsg={msgSend}
      createTxFunction={createTxMsgSend}
      onSuccessfulTx={async () => {
        await accounts.fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchSequence: true, fetchBalance: true }], true);
      }}
      requireRegistration
      coinsToTransfer={[
        {
          denom: 'badge',
          amount: BigInt(sendAmount)
        }
      ]}
    >
      {children}
    </TxModal >
  );
}