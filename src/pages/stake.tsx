import { Form, Spin } from 'antd';
import { convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../components/address/AddressDisplay';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { NumberInput } from '../components/inputs/NumberInput';
import { TxModal } from '../components/tx-modals/TxModal';
import { GenericTextFormInput } from '../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';

function StakingPage() {
  const [visible, setVisible] = useState(false);
  const [unstakeIsVisible, setUnstakeIsVisible] = useState(false);
  const chain = useChainContext();
  const [stakeAmount, setStakeAmount] = useState(1);
  const [validatorAddress, setValidatorAddress] = useState('');

  const [currentStake, setCurrentStake] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chain.cosmosAddress) return;
    if (!validatorAddress) return;

    setLoading(true);
    fetch(`http://node.bitbadges.io:1317/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations/${chain.cosmosAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code) {
          setCurrentStake(0);
        } else {
          setCurrentStake(data.delegation.balance.amount);
        }

        setLoading(false);
      });
  }, [validatorAddress, chain.cosmosAddress]);

  return (
    <DisconnectedWrapper
      requireLogin
      requiresSignature
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
          }}>
          <div className="flex-center flex-wrap">
            <InformationDisplayCard
              md={12}
              sm={24}
              xs={24}
              title="Stake"
              subtitle="Stake your badge tokens to a validator to help secure the network and earn rewards.">
              <div className="flex-center flex-column">
                <div className="flex-center mt-12">
                  <AddressDisplay addressOrUsername={chain.cosmosAddress} />
                </div>
                <Form layout="vertical" className="w-full mt-2">
                  <GenericTextFormInput value={validatorAddress} setValue={setValidatorAddress} label="Validator Address" />
                </Form>
                {validatorAddress && (
                  <div className="flex-center my-2">
                    You currently have {currentStake} staked with this validator.
                    {loading && <Spin />}
                  </div>
                )}

                {validatorAddress && <NumberInput title="Stake" min={1} value={stakeAmount} setValue={setStakeAmount} />}
                <div className="flex-center mt-4">
                  <button
                    disabled={loading || !validatorAddress || stakeAmount <= 0}
                    className="landing-button flex-center mx-2"
                    onClick={() => {
                      setUnstakeIsVisible(true);
                    }}>
                    Unstake
                  </button>
                  <button
                    disabled={loading || !validatorAddress || stakeAmount <= 0}
                    className=" landing-button flex-center mx-2"
                    onClick={() => {
                      setVisible(true);
                    }}>
                    Stake
                  </button>
                </div>
              </div>
            </InformationDisplayCard>
          </div>
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
          />{' '}
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
        </div>
      }
    />
  );
}

export default StakingPage;
