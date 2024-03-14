import { CloseOutlined, CloudSyncOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Row, StepProps, Steps } from 'antd';
import { BalanceArray, TransferActivityDoc, TransferWithIncrements, getBalancesAfterTransfers } from 'bitbadgesjs-sdk';
import { ReactNode, useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BalanceInput } from '../balances/BalanceInput';
import { ActivityTab } from '../collection-page/TransferActivityDisplay';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { RadioGroup } from '../inputs/Selects';
import { RecipientsSelectStep } from './RecipientsSelectStep';
import { TransferDisplay } from './TransferDisplay';

const { Step } = Steps;

export function TransferSelect({
  transfers,
  setTransfers,
  collectionId,
  plusButton,
  setVisible,
  sender,
  originalSenderBalances,
  hideTransferDisplay,
  hideRemaining,
  showApprovalsMessage,
  fetchExisting
}: {
  transfers: Array<TransferWithIncrements<bigint>>;
  setTransfers: (transfers: Array<TransferWithIncrements<bigint>>) => void;
  sender: string;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  originalSenderBalances: BalanceArray<bigint>;
  plusButton?: boolean;
  hideRemaining?: boolean;
  setVisible?: (visible: boolean) => void;
  showApprovalsMessage?: boolean;
  fetchExisting?: () => Promise<void>;
}) {
  const chain = useChainContext();

  const [numRecipients, setNumRecipients] = useState<bigint>(0n);
  const [postTransferBalancesWithoutCurrent, setPostTransferBalancesWithoutCurrent] = useState<BalanceArray<bigint>>();
  const [postTransferBalancesWithCurrent, setPostTransferBalancesWithCurrent] = useState<BalanceArray<bigint>>();
  const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  //For the current transfer we are going to add (we also use these fields to calculate the claim amounts and badges)
  const [balances, setBalances] = useState<BalanceArray<bigint>>(new BalanceArray<bigint>());
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [incrementAmount, setIncrementAmount] = useState<bigint>(0n);
  const [transfersToAdd, setTransfersToAdd] = useState<Array<TransferWithIncrements<bigint>>>([]);

  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours() + 1);
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: convert transfers');
    const transfersToAdd: Array<TransferWithIncrements<bigint>> = [];
    const currBalances = balances.clone();
    for (const address of toAddresses) {
      transfersToAdd.push(
        new TransferWithIncrements<bigint>({
          toAddresses: [address],
          balances: currBalances,
          from: sender
        })
      );

      if (incrementAmount > 0n) {
        currBalances.applyIncrements(incrementAmount, 0n, 1n);
      }
    }

    setTransfersToAdd(transfersToAdd);
  }, [balances, incrementAmount, sender, toAddresses]);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  //Whenever something changes, update the pre and post transfer balances
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: convert transfers');
    const convertedTransfers = transfers ?? [];
    const transfersToAdd: Array<TransferWithIncrements<bigint>> = [
      new TransferWithIncrements({
        toAddresses: toAddresses,
        balances: balances,
        from: sender,
        incrementBadgeIdsBy: incrementAmount
      })
    ];

    //Calculate from beginning
    let postTransferBalanceObj = originalSenderBalances.clone();
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...convertedTransfers], true);
    setPostTransferBalancesWithoutCurrent(postTransferBalanceObj.clone());
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...transfersToAdd], true);
    setPostTransferBalancesWithCurrent(postTransferBalanceObj);
  }, [originalSenderBalances, transfers, balances, sender, toAddresses, incrementAmount]);

  const uintRangesOverlap = balances.some((balance) => balance.badgeIds.hasOverlaps());
  const ownedTimesOverlap = balances.some((balance) => balance.ownershipTimes.hasOverlaps());
  const uintRangesLengthEqualsZero = balances.some((balance) => balance.badgeIds.length === 0);
  const ownedTimesLengthEqualsZero = balances.some((balance) => balance.ownershipTimes.length === 0);

  //We have five potential steps
  //1. Select recipients, number of codes, max number of claims depending on distribution method
  //2. Select badges to distribute
  //3. Select amount to distribute
  //4. Select time range (if claim)
  //5. Review and confirm
  const steps: StepProps[] = [];
  const recipientsSelect = RecipientsSelectStep({
    sender: sender,
    setNumRecipients,
    toAddresses: toAddresses,
    setToAddresses: setToAddresses,
    showApprovalsMessage: showApprovalsMessage
  });
  steps.push(recipientsSelect);

  //Add third step
  steps.push({
    title: 'Amounts',
    description: (
      <div>
        {numRecipients > 0n && transfersToAdd.length > 0 && balances.length > 0 && (
          <div className="flex">
            <Col md={24} xs={24}>
              <TransferDisplay transfers={transfersToAdd} collectionId={collectionId} initiatedBy={chain.address} />
            </Col>
          </div>
        )}
        <div style={{ textAlign: 'center', margin: 10 }}>
          <BalanceInput
            suggestedBalances={originalSenderBalances}
            balancesToShow={balances}
            onAddBadges={(balance) => {
              setBalances(BalanceArray.From([...balances, balance]).clone());
            }}
            hideDisplay
            message="asd"
            onRemoveAll={() => {
              setBalances(new BalanceArray<bigint>());
            }}
            increment={incrementAmount}
            setIncrement={numRecipients > 1n ? setIncrementAmount : undefined}
            numIncrements={numRecipients}
            originalBalances={postTransferBalancesWithoutCurrent}
            
          />
        </div>
        <br />

        {postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0) && (
          <div style={{ textAlign: 'center' }}>
            <WarningOutlined style={{ color: 'red' }} />
            <span style={{ marginLeft: 8, color: 'red' }}>You are distributing more badges than the sender owns.</span>
            <br />
            <br />
          </div>
        )}
      </div>
    ),
    disabled:
      balances.length == 0 ||
      numRecipients <= 0 ||
      uintRangesOverlap ||
      uintRangesLengthEqualsZero ||
      ownedTimesOverlap ||
      ownedTimesLengthEqualsZero ||
      !!postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0)
  });

  steps.push({
    title: 'Confirm',
    description: (
      <div className="flex-center flex-column">
        <div>
          <TransferDisplay transfers={transfersToAdd} collectionId={collectionId} initiatedBy={chain.address} />
        </div>

        <br />

        <button
          className="landing-button"
          style={{ width: '100%' }}
          onClick={async () => {
            setTransfers([...transfersToAdd, ...transfers]);
            setBalances(new BalanceArray<bigint>());
            setNumRecipients(0n);
            setToAddresses([]);
            setAddTransferIsVisible(false);
            setCurrentStep(0);
            setBalances(new BalanceArray<bigint>());
            if (setVisible) setVisible(false);
          }}>
          Add Transfer(s)
        </button>
      </div>
    ),
    disabled:
      balances.length == 0 ||
      numRecipients <= 0 ||
      uintRangesOverlap ||
      uintRangesLengthEqualsZero ||
      ownedTimesOverlap ||
      ownedTimesLengthEqualsZero ||
      !!postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0)
  });

  return (
    <>
      <div style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className="primary-text">
        {!hideRemaining && (
          <Row style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
            <InformationDisplayCard title="" md={24} sm={24} xs={24} style={{ alignItems: 'normal' }} noBorder inheritBg>
              <div className="flex">
                <BalancesBeforeAndAfterCard
                  title="Sender Balances"
                  subtitle={
                    <div className="flex-center">
                      <AddressDisplay addressOrUsername={sender} />
                    </div>
                  }
                  postBalances={postTransferBalancesWithoutCurrent}
                  originalBalances={originalSenderBalances}
                  collectionId={collectionId}
                />
                <InformationDisplayCard title="Added Transfers" style={{ alignItems: 'normal' }} md={12} sm={24} xs={24}>
                  <>
                    {[...(transfers ?? [])].length === 0 && (
                      <Empty className="primary-text" image={Empty.PRESENTED_IMAGE_SIMPLE} description={'None added.'} />
                    )}

                    {[...(transfers ?? [])].length > 0 && (
                      <>
                        <ActivityTab
                          paginated
                          activity={transfers
                            .map((x) => {
                              return new TransferActivityDoc({
                                _docId: `collection-${collectionId}-${x.from}-${x.toAddresses.join('-')}`,
                                from: x.from,
                                balances: x.balances,
                                collectionId: collectionId,
                                to: x.toAddresses,
                                initiatedBy: chain.address,
                                timestamp: BigInt(Date.now()),
                                block: 0n
                              });
                            })
                            .flat()}
                          fetchMore={async () => {}}
                          hasMore={false}
                          onDelete={(idx) => {
                            const newTransfers = transfers.filter((_, i) => i !== idx);
                            setTransfers(newTransfers);
                          }}
                        />
                      </>
                    )}
                  </>
                </InformationDisplayCard>
              </div>
              <div style={{ alignItems: 'center' }} className="primary-text full-width">
                {!addTransferIsVisible && !hideTransferDisplay && (
                  <div>
                    <br />
                    <br />
                  </div>
                )}

                {addTransferIsVisible || setVisible ? (
                  <>
                    <br />
                    <div className="flex-center flex-wrap">
                      <div>
                        {plusButton ? (
                          <div className="flex-center">
                            <IconButton
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setAddTransferIsVisible(false);
                              }}
                              src={<CloseOutlined />}
                              text="Close"></IconButton>
                          </div>
                        ) : (
                          <div className="flex-center">
                            <Button
                              type="primary"
                              onClick={() => {
                                setAddTransferIsVisible(true);
                              }}
                              style={{ marginTop: 20, width: '100%' }}>
                              Add New Transfer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <br />
                    <InformationDisplayCard title="" style={{ alignItems: 'normal' }} md={24} sm={24} xs={24}>
                      <Steps current={currentStep} onChange={onStepChange} className="full-width">
                        {steps.map((item, index) => (
                          <Step
                            key={index}
                            title={<b className="primary-text hover:text-vivid-blue">{item.title}</b>}
                            disabled={steps?.find((step, idx) => step.disabled && idx < index) ? true : false}
                          />
                        ))}
                      </Steps>
                      {steps.map((item, index) => (
                        <div key={index} className="primary-text full-width">
                          {currentStep === index && <div className="full-width">{item.description}</div>}
                        </div>
                      ))}
                    </InformationDisplayCard>
                  </>
                ) : (
                  <>
                    <div className="flex-center flex-wrap">
                      <div>
                        {plusButton ? (
                          <div className="flex-center">
                            <IconButton
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setAddTransferIsVisible(true);
                              }}
                              src={<PlusOutlined />}
                              text="Add Transfer"></IconButton>
                          </div>
                        ) : (
                          <div className="flex-center">
                            <Button
                              type="primary"
                              onClick={() => {
                                setAddTransferIsVisible(true);
                              }}
                              style={{ marginTop: 20, width: '100%' }}>
                              Add New Transfer
                            </Button>
                          </div>
                        )}
                      </div>
                      {fetchExisting && (
                        <div className="flex-center">
                          <IconButton
                            style={{ cursor: 'pointer' }}
                            onClick={async () => {
                              await fetchExisting();
                            }}
                            src={<CloudSyncOutlined />}
                            text="Fetch Existing"></IconButton>
                        </div>
                      )}
                      <div>
                        <IconButton
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setTransfers([]);
                          }}
                          src={<DeleteOutlined />}
                          text="Delete All"></IconButton>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <br />
            </InformationDisplayCard>
          </Row>
        )}
      </div>
    </>
  );
}

export const BalancesBeforeAndAfterCard = ({
  originalBalances,
  postBalances,
  addTransferIsVisible,
  collectionId,
  subtitle,
  title,
  md
}: {
  addTransferIsVisible?: boolean;
  originalBalances: BalanceArray<bigint>;
  postBalances?: BalanceArray<bigint>;
  transfers?: Array<TransferWithIncrements<bigint>>;
  collectionId: bigint;
  title?: string;
  subtitle?: string | ReactNode;
  md?: number;
}) => {
  const [balanceTab, setBalanceTab] = useState('remaining');

  return (
    <InformationDisplayCard title={title} style={{ alignItems: 'normal' }} md={md ?? 12} sm={24} xs={24} subtitle={subtitle}>
      <RadioGroup
        value={balanceTab}
        onChange={(e) => {
          setBalanceTab(e);
        }}
        options={[
          {
            label: 'Start',
            value: 'start'
          },
          {
            label: 'Remaining',
            value: 'remaining'
          }
        ]}
      />
      {balanceTab === 'remaining' && (
        <>
          <div className="secondary-text text-center">
            <InfoCircleOutlined /> The remaining balances after the transfers are applied
            {addTransferIsVisible && <> (including the current transfer)</>}.
          </div>
          <br />

          <BalanceDisplay hideMessage collectionId={collectionId ?? NEW_COLLECTION_ID} balances={postBalances ?? new BalanceArray<bigint>()} />
        </>
      )}

      {balanceTab === 'start' && (
        <>
          <div className="secondary-text text-center">
            <InfoCircleOutlined /> {'The balances before any transfers are applied.'}
          </div>
          <br />
          <BalanceDisplay hideMessage collectionId={collectionId ?? NEW_COLLECTION_ID} balances={originalBalances ?? []} />
        </>
      )}
    </InformationDisplayCard>
  );
};
