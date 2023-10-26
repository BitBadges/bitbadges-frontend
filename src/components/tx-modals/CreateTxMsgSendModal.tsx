import { InputNumber } from 'antd';
import { MsgSend, createTxMsgSend } from 'bitbadgesjs-proto';
import React, { useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
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

  const currSelectedAccount = accounts.getAccount(currUserInfo);

  const msgSend: MsgSend<bigint> = {
    destinationAddress: currSelectedAccount?.cosmosAddress ?? '',
    amount: BigInt(sendAmount),
    denom: 'badge'
  }

  const msgSteps = [
    {
      title: 'Recipient',
      description: <div style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <AddressSelect onUserSelect={setCurrUserInfo} defaultValue={signedInAccount?.address} />
      </div>,
      disabled: !currSelectedAccount
    },
    {
      title: 'Amount',
      description: <div className='flex-center flex-column'>
        <b>$BADGE to Send</b>
        <InputNumber
          value={sendAmount}
          onChange={(e) => {
            setSendAmount(e ?? 0);
          }}
          className='dark:text-white inherit-bg'
          min={0}
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