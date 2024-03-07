import { useState } from 'react';
import { TxModal } from '../../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';

function DappExample() {
  const [visible, setVisible] = useState(false);
  const chain = useChainContext();

  return (
    <DisconnectedWrapper
      requireLogin
      message="Please connect a wallet and sign in to access this page."
      node={
        <div
          style={{
            marginLeft: '3vw',
            marginRight: '3vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
            minHeight: '100vh'
          }}
          className="flex-center"
        >
          {
            <>
              <button
                className="landing-button flex-center"
                onClick={() => {
                  setVisible(true);
                }}
              >
                Interact
              </button>
            </>
          }

          {
            <TxModal
              visible={visible}
              setVisible={setVisible}
              txName={'dApp Example'}
              txsInfo={[
                {
                  type: 'MsgExecuteContractCompat',
                  msg: {
                    sender: chain.cosmosAddress,
                    contract: 'cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr', //TODO: Replace with contract address
                    msg: '{"deleteCollectionMsg": {"collectionId": "1"}}', //TODO: Replace with msg
                    funds: '1badge' //TODO: Replace with funds
                  }
                }
              ]}
            />
          }
        </div>
      }
    />
  );
}

export default DappExample;
