import { convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { AddressSelect } from '../components/address/AddressSelect';
import { NumberInput } from '../components/inputs/NumberInput';
import { TxModal } from '../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { GenericTextFormInput } from '../components/tx-timelines/form-items/MetadataForm';

function StakingPage() {
  const [visible, setVisible] = useState(false);
  const [unstakeIsVisible, setUnstakeIsVisible] = useState(false);
  const chain = useChainContext();
  const [stakeAmount, setStakeAmount] = useState(1);
  const [validatorAddress, setValidatorAddress] = useState('');

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
          className="flex-center">
          <GenericTextFormInput value={validatorAddress} setValue={setValidatorAddress} label="Validator Address" />
          <NumberInput min={1} value={stakeAmount} setValue={setStakeAmount} />
          <button
            className="landing-button flex-center"
            onClick={() => {
              setVisible(true);
            }}>
            Stake
          </button>
          {
            <TxModal
              visible={visible}
              setVisible={setVisible}
              txName={'dApp Example'}
              txsInfo={[
                {
                  type: 'MsgDelegate',
                  msg: {
                    delegatorAddress: chain.cosmosAddress,
                    validatorAddress: validatorAddress,
                    amount: {
                      denom: 'badge',
                      amount: stakeAmount.toString()
                    }
                  }
                }
              ]}
            />
          }

          <button
            className="landing-button flex-center"
            onClick={() => {
              setUnstakeIsVisible(true);
            }}>
            Unstake
          </button>

          <TxModal
            visible={unstakeIsVisible}
            setVisible={setUnstakeIsVisible}
            txName={'dApp Example'}
            txsInfo={[
              {
                type: 'MsgUndelegate',
                msg: {
                  delegatorAddress: chain.cosmosAddress,
                  validatorAddress: convertToCosmosAddress(validatorAddress),
                  amount: {
                    denom: 'badge',
                    amount: stakeAmount.toString()
                  }
                }
              }
            ]}
          />
        </div>
      }
    />
  );
}

export default StakingPage;
