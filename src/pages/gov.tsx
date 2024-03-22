import { convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { fetchAccounts } from '../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../components/address/AddressDisplay';
import { DevMode } from '../components/common/DevMode';
import { Pagination } from '../components/common/Pagination';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { TableRow } from '../components/display/TableRow';
import { NumberInput } from '../components/inputs/NumberInput';
import { RadioGroup } from '../components/inputs/Selects';
import { TxModal } from '../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { NODE_API_URL } from '../constants';

//TODO: type it
// import { proto } from 'bitbadgesjs-sdk';
// const Proposal = proto.cosmos.gov.v1beta1.Proposal;

function StakingPage() {
  const chain = useChainContext();
  const [deposit, setDeposit] = useState(1);

  const [loading, setLoading] = useState(false);

  const [currProposals, setCurrProposals] = useState<any[]>([]);
  const [voteIsVisible, setVoteIsVisible] = useState(false);

  const [depositIsVisible, setDepositIsVisible] = useState(false);
  const [voteOption, setVoteOption] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(NODE_API_URL + '/cosmos/gov/v1/proposals')
      .then((res) => res.json())
      .then((data) => {
        setCurrProposals(data.proposals);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAccounts(currProposals.map((x) => x.proposer)).then((res) => {
      console.log(res);
    });
  }, [currProposals]);

  // const depositProposals = currProposals.filter((x) => x.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD');
  // const activeProposals = currProposals.filter((x) => x.status === 'PROPOSAL_STATUS_VOTING_PERIOD');
  // const passedProposals = currProposals.filter((x) => x.status === 'PROPOSAL_STATUS_PASSED');
  // const rejectedProposals = currProposals.filter((x) => x.status === 'PROPOSAL_STATUS_REJECTED');

  const [currPage, setCurrPage] = useState(1);
  const currProposal = currProposals[currPage - 1];
  const isSoftwareUpgradeProposal = currProposal?.messages?.[0]?.['@type'] === '/cosmos.gov.v1.MsgExecLegacyContent';

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
          <div className="flex-center">
            <Pagination
              currPage={currPage}
              showOnSinglePage
              onChange={(page) => {
                setCurrPage(page);
              }}
              total={currProposals.length}
              pageSize={1}
            />
          </div>
          {currProposal && (
            <>
              <div className="flex-center">
                <InformationDisplayCard md={12} xs={24} sm={24} title={currProposal.title} subtitle={currProposal.summary}>
                  <div className="flex-center mt-3"></div>
                  <TableRow label="Proposal ID" value={currProposal.id} labelSpan={12} valueSpan={12} />
                  <TableRow
                    label="Proposal Type"
                    value={
                      <div>
                        {isSoftwareUpgradeProposal && <span>Software Upgrade</span>}
                        {!isSoftwareUpgradeProposal && <span>Standard</span>}
                      </div>
                    }
                    labelSpan={12}
                    valueSpan={12}
                  />
                  {isSoftwareUpgradeProposal && (
                    <TableRow label="Upgrade Height" value={'Block ' + currProposal.messages[0].content.plan.height} labelSpan={12} valueSpan={12} />
                  )}
                  <TableRow
                    label="Proposal Status"
                    value={
                      <div>
                        {currProposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' && <span>Deposit Period</span>}
                        {currProposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD' && <span>Voting Period</span>}
                        {currProposal.status === 'PROPOSAL_STATUS_PASSED' && <span>Passed</span>}
                        {currProposal.status === 'PROPOSAL_STATUS_REJECTED' && <span>Rejected</span>}
                      </div>
                    }
                    labelSpan={12}
                    valueSpan={12}
                  />
                  <TableRow
                    label="Proposer"
                    value={
                      <div style={{ float: 'right' }}>
                        <AddressDisplay addressOrUsername={currProposal.proposer} />
                      </div>
                    }
                    labelSpan={12}
                    valueSpan={12}
                  />
                  <TableRow
                    label="Total $BADGE Deposit (Min 100 required)"
                    value={currProposal.total_deposit.find((x: any) => x.denom === 'badge')?.amount || 0}
                    labelSpan={12}
                    valueSpan={12}
                  />

                  <TableRow
                    label="Deposit Times"
                    value={
                      <div>
                        <div>Start: {new Date(currProposal.submit_time).toLocaleString()}</div>
                        <div>End: {new Date(currProposal.deposit_end_time).toLocaleString()}</div>
                      </div>
                    }
                    labelSpan={12}
                    valueSpan={12}
                  />

                  {currProposal.status !== 'PROPOSAL_STATUS_DEPOSIT_PERIOD' && (
                    <TableRow
                      label="Vote Times"
                      value={
                        <div>
                          <div>Start: {new Date(currProposal.voting_start_time).toLocaleString()}</div>
                          <div>End: {new Date(currProposal.voting_end_time).toLocaleString()}</div>
                        </div>
                      }
                      labelSpan={12}
                      valueSpan={12}
                    />
                  )}
                  <div className="flex-center flex-wrap mt-12" style={{ alignItems: 'normal' }}>
                    {currProposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' && (
                      <InformationDisplayCard
                        md={24}
                        sm={24}
                        xs={24}
                        title="Deposit"
                        subtitle="Proposals require a minimum deposit to go into voting period. Users that deposited on proposals will recover their deposits if the proposal was accepted or rejected. If the proposal was vetoed, or never entered voting period (minimum deposit not reached within deposit period), the deposit is burned.">
                        <div className="flex-center flex-column">
                          <div className="flex-center my-6">
                            <AddressDisplay addressOrUsername={chain.cosmosAddress} />
                          </div>
                          <NumberInput title="$BADGE Amount" min={1} value={deposit} setValue={setDeposit} />
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
                    )}
                    {currProposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD' && (
                      <InformationDisplayCard
                        md={24}
                        sm={24}
                        xs={24}
                        title="Vote"
                        subtitle="Vote on a proposal. Delegators will inherit their validator's vote if they don't vote themselves.
    ">
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
                    )}
                  </div>
                </InformationDisplayCard>
              </div>
            </>
          )}

          <TxModal
            visible={depositIsVisible}
            setVisible={setDepositIsVisible}
            txName={'Deposit'}
            txsInfo={[
              {
                type: 'MsgDeposit',
                msg: {
                  proposalId: currProposal?.id,
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
                  proposalId: currProposal?.id,
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
