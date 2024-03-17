import { Form } from 'antd';
import { convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../components/address/AddressDisplay';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { NumberInput } from '../components/inputs/NumberInput';
import { RadioGroup } from '../components/inputs/Selects';
import { TxModal } from '../components/tx-modals/TxModal';
import { GenericTextAreaFormInput, GenericTextFormInput } from '../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { DevMode } from '../components/common/DevMode';

function StakingPage() {
  const [visible, setVisible] = useState(false);
  const chain = useChainContext();
  const [deposit, setDeposit] = useState(1);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const [loading, setLoading] = useState(false);

  const [currProposals, setCurrProposals] = useState([]);
  const [voteIsVisible, setVoteIsVisible] = useState(false);

  const [depositIsVisible, setDepositIsVisible] = useState(false);
  const [voteOption, setVoteOption] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:1317/cosmos/gov/v1/proposals')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setCurrProposals(data.proposals);
        setLoading(false);
      });
  }, []);

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
          <div className="flex-center">
            {currProposals.map((x, i) => {
              return <DevMode override obj={x} key={i} />;
            })}
          </div>
          <div className="flex-center flex-wrap">
            <InformationDisplayCard md={12} sm={24} xs={24} title="Submit Proposal" subtitle="Submit a proposal to the network.">
              <div className="flex-center flex-column">
                <div className="flex-center mt-12">
                  <AddressDisplay addressOrUsername={chain.cosmosAddress} />
                </div>
                <Form layout="vertical" className="w-full mt-2">
                  <GenericTextFormInput value={title} setValue={setTitle} label="Title" />
                  <GenericTextAreaFormInput value={summary} setValue={setSummary} label="Summary" />
                </Form>

                {<NumberInput title="Stake" min={1} value={deposit} setValue={setDeposit} />}
                <div className="flex-center mt-4">
                  <button
                    disabled={loading || !title || deposit <= 0}
                    className=" landing-button flex-center mx-2"
                    onClick={() => {
                      setVisible(true);
                    }}>
                    Submit
                  </button>
                </div>
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard md={12} sm={24} xs={24} title="Submit Proposal" subtitle="Submit a proposal to the network.">
              <div className="flex-center flex-column">
                <div className="flex-center mt-12">
                  <AddressDisplay addressOrUsername={chain.cosmosAddress} />
                </div>
                {<NumberInput title="Stake" min={1} value={deposit} setValue={setDeposit} />}
                <div className="flex-center mt-4">
                  <button
                    disabled={loading || deposit <= 0}
                    className=" landing-button flex-center mx-2"
                    onClick={() => {
                      setDepositIsVisible(true);
                    }}>
                    Deposit
                  </button>
                </div>
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard md={12} sm={24} xs={24} title="Vote" subtitle="Vote on a proposal.">
              <div className="flex-center flex-column">
                <div className="flex-center mt-12">
                  <AddressDisplay addressOrUsername={chain.cosmosAddress} />
                </div>
                <div className="flex-center">
                  <RadioGroup
                    value={voteOption}
                    onChange={setVoteOption}
                    options={[
                      { label: 'Yes', value: 1 },
                      { label: 'Abstain', value: 2 },
                      { label: 'No', value: 3 },
                      { label: 'No With Veto', value: 4 }
                    ]}
                  />
                </div>
                <div className="flex-center mt-4">
                  <button
                    disabled={loading}
                    className=" landing-button flex-center mx-2"
                    onClick={() => {
                      setVoteIsVisible(true);
                    }}>
                    Vote
                  </button>
                </div>
              </div>
            </InformationDisplayCard>
          </div>
          <TxModal
            visible={visible}
            setVisible={setVisible}
            txName={'Submit Proposal'}
            txsInfo={[
              {
                type: 'MsgSubmitProposal',
                msg: {
                  // messages: [
                  //   {
                  //     typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
                  //     value: {
                  //       initialDeposit: [{ denom: 'badge', amount: deposit.toString() }],
                  //       proposer: convertToCosmosAddress(chain.cosmosAddress),
                  //       metadata: '*',
                  //       title,
                  //       summary
                  //     }
                  //   }
                  // ],
                  content: {
                    type: 'cosmos-sdk/TextProposal',
                    title,
                    summary
                  },
                  initialDeposit: [{ denom: 'badge', amount: deposit.toString() }],
                  proposer: convertToCosmosAddress(chain.cosmosAddress),
                  metadata: '*'
                }
              }
            ]}
          />
          <TxModal
            visible={depositIsVisible}
            setVisible={setDepositIsVisible}
            txName={'Deposit'}
            txsInfo={[
              {
                type: 'MsgDeposit',
                msg: {
                  proposalId: '1',
                  depositor: convertToCosmosAddress(chain.cosmosAddress),
                  amount: [{ denom: 'badge', amount: deposit.toString() }]
                }
              }
            ]}
          />
          <TxModal
            visible={voteIsVisible}
            setVisible={setVoteIsVisible}
            txName={'Vote'}
            txsInfo={[
              {
                type: 'MsgVote',
                msg: {
                  proposalId: '1',
                  voter: convertToCosmosAddress(chain.cosmosAddress),
                  option: voteOption
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
