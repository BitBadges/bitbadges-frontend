import { InputNumber } from 'antd';
import { MsgSend, createTxMsgSend } from 'bitbadgesjs-proto';
import React, { useMemo, useState } from 'react';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';
import { useAccount, fetchAccountsWithOptions } from '../../bitbadges-api/contexts/accounts/AccountsContext';

export function CreateTxMsgSendModal({ visible, setVisible, children,
}: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();

  const signedInAccount = useAccount(chain.address);

  const [currUserInfo, setCurrUserInfo] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<number>(0);

  const currSelectedAccount = useAccount(currUserInfo);

  const msgSend: MsgSend<bigint> = useMemo(() => {
    return {
      destinationAddress: currSelectedAccount?.cosmosAddress ?? '',
      amount: BigInt(sendAmount),
      denom: 'badge'
    }
  }, [currSelectedAccount, sendAmount]);

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
          className='primary-text inherit-bg'
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
        await fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchSequence: true, fetchBalance: true }], true);
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