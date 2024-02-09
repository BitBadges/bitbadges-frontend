import { InputNumber } from 'antd';
import { MsgSend } from 'bitbadgesjs-sdk';
import React, { useMemo, useState } from 'react';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccountsWithOptions, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgSendModal({ visible, setVisible, children,
}: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();

  const signedInAccount = useAccount(chain.address);

  const [recipient, setRecipient] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<number>(0);

  const currSelectedAccount = useAccount(recipient);

  const msgSend: MsgSend<bigint> = useMemo(() => {
    return {
      fromAddress: chain.cosmosAddress,
      toAddress: currSelectedAccount?.cosmosAddress ?? '',
      amount: [{
        amount: BigInt(sendAmount),
        denom: 'badge'
      }]
    }
  }, [currSelectedAccount, sendAmount, chain.cosmosAddress]);

  const msgSteps = [
    {
      title: 'Recipient',
      description: <div style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <AddressSelect onUserSelect={setRecipient} defaultValue={signedInAccount?.address} />
        <br />
        {signedInAccount?.cosmosAddress === currSelectedAccount?.cosmosAddress ? <div style={{ color: 'red' }}>Recipient and sender cannot be the same.</div> : null}
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

  const txsInfo = useMemo(() => {
    return [
      {
        type: 'MsgSend',
        msg: msgSend,
        afterTx: async () => {
          await fetchAccountsWithOptions([
            { address: chain.cosmosAddress, fetchSequence: true, fetchBalance: true },
            { address: currSelectedAccount?.cosmosAddress ?? '', fetchSequence: true, fetchBalance: true },
          ], true);
        }
      }
    ]
  }, [msgSend, chain.cosmosAddress, currSelectedAccount]);

  return (
    <TxModal
      msgSteps={msgSteps}
      visible={visible}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Send $BADGE"
      coinsToTransfer={[
        {
          denom: 'badge',
          amount: BigInt(sendAmount)
        }
      ]}
    >
      {children}
    </TxModal>

  );
}