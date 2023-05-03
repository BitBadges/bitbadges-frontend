import { InputNumber, Modal } from 'antd';
import { MessageSendParams, createMessageSend } from 'bitbadgesjs-transactions';
import { BitBadgesUserInfo, isAddressValid } from 'bitbadgesjs-utils';
import React, { useState } from 'react';
import { BLANK_USER_INFO, PRIMARY_BLUE } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';

export function CreateTxMsgSendModal({ visible, setVisible, children,
}: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();

  const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>(BLANK_USER_INFO);
  const [sendAmount, setSendAmount] = useState<number>(0);

  const msgSend: MessageSendParams = {
    destinationAddress: currUserInfo?.cosmosAddress ? currUserInfo.cosmosAddress : '',
    amount: `${sendAmount}`,
    denom: 'badge'
  }

  const msgSteps = [
    {
      title: 'Select Recipient',
      description: <div style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AddressSelect
          darkMode
          onUserSelect={setCurrUserInfo}
        />
      </div>,
      disabled: !isAddressValid(currUserInfo.address),
    },
    {
      title: 'Select Amount',
      description: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <b>$BADGE to Send</b>
        <InputNumber
          value={sendAmount}
          onChange={(e) => {
            setSendAmount(e)
          }}
          style={{ backgroundColor: PRIMARY_BLUE, color: 'white' }}
          min={0}
          max={chain.balance}
        />
        <br />
        <b>Current Balance: {chain.balance} $BADGE</b>
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
      createTxFunction={createMessageSend}
      onSuccessfulTx={async () => {
        await chain.updatePortfolioInfo(chain.address);
        Modal.destroyAll()
      }}
      requireRegistration
    >
      {children}
    </TxModal >
  );
}