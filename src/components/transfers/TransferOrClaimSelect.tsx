import { CloseOutlined, CloudSyncOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Radio, Row, StepProps, Steps, Tooltip } from 'antd';
import { Balance, BigIntify, convertBalance } from 'bitbadgesjs-proto';
import { TransferMethod, TransferWithIncrements, checkIfUintRangesOverlap, deepCopyBalances, getBalancesAfterTransfers } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { ActivityTab } from '../collection-page/TransferActivityDisplay';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { BalanceInput } from '../inputs/BalanceInput';
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
  fetchExisting,
  isOffChainBalancesUpdate
}: {
  transfers: (TransferWithIncrements<bigint>)[],
  setTransfers: (transfers: (TransferWithIncrements<bigint>)[]) => void;
  sender: string,
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  originalSenderBalances: Balance<bigint>[];
  plusButton?: boolean;
  hideRemaining?: boolean;
  setVisible?: (visible: boolean) => void;
  showApprovalsMessage?: boolean;
  fetchExisting?: () => Promise<void>;
  isOffChainBalancesUpdate?: boolean;
}
) {
  const chain = useChainContext();

  const [numRecipients, setNumRecipients] = useState<bigint>(0n);
  const [postTransferBalancesWithCurrent, setPostTransferBalancesWithCurrent] = useState<Balance<bigint>[]>();
  const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  //For the current transfer we are going to add (we also use these fields to calculate the claim amounts and badges)
  const [balances, setBalances] = useState<Balance<bigint>[]>([]);
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [incrementAmount, setIncrementAmount] = useState<bigint>(0n);
  const [transfersToAdd, setTransfersToAdd] = useState<TransferWithIncrements<bigint>[]>([]);

  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours() + 1);
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  useEffect(() => {
    let transfersToAdd: TransferWithIncrements<bigint>[] = [];
    let currBalances = deepCopyBalances(balances);
    for (const address of toAddresses) {
      transfersToAdd.push({
        toAddresses: [address],
        balances: currBalances,
        from: sender,
      });

      if (incrementAmount > 0n) {
        currBalances = currBalances.map((balance) => {
          return {
            ...balance,
            badgeIds: balance.badgeIds.map((uintRange) => {
              return {
                start: uintRange.start + incrementAmount,
                end: uintRange.end + incrementAmount
              }
            })
          }
        })
      }
    }

    setTransfersToAdd(transfersToAdd);
  }, [balances, incrementAmount, sender, toAddresses]);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  let totalNumBadges = 0n;
  for (const balance of balances) {
    for (const badgeUintRange of balance.badgeIds) {
      totalNumBadges += badgeUintRange.end - badgeUintRange.start + 1n;
    }
  }

  //Whenever something changes, update the pre and post transfer balances
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: convert transfers');
    let convertedTransfers = transfers ?? [];
    let transfersToAdd = [{
      toAddresses: toAddresses,
      balances: balances,
      from: sender,
    }];

    //Calculate from beginning
    let postTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));
    let preTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));

    if (!postTransferBalanceObj || postTransferBalanceObj.length == 0) return;
    if (!preTransferBalanceObj || preTransferBalanceObj.length == 0) return;

    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...convertedTransfers], true)

    //with existing ones to add
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...transfersToAdd], true);
    setPostTransferBalancesWithCurrent(postTransferBalanceObj);
  }, [originalSenderBalances, transfers, balances, sender, toAddresses]);

  const uintRangesOverlap = checkIfUintRangesOverlap(balances[0]?.badgeIds || []);
  const uintRangesLengthEqualsZero = balances[0]?.badgeIds.length === 0;

  const ownedTimesOverlap = checkIfUintRangesOverlap(balances[0]?.ownershipTimes || []);
  const ownedTimesLengthEqualsZero = balances[0]?.ownershipTimes.length === 0;

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
    showApprovalsMessage: showApprovalsMessage,
  });
  steps.push(recipientsSelect);


  //Add third step
  steps.push({
    title: 'Amounts',
    description: <div>
      {numRecipients > 0n && transfersToAdd.length > 0 && balances.length > 0 && < div className='flex'>
        {/* <hr /> */}
        <Col md={24} xs={24}>
          <TransferDisplay
            transfers={transfersToAdd}
            collectionId={collectionId}
          />
        </Col>
      </div>
      }
      < div style={{ textAlign: 'center', margin: 10 }}>

        <BalanceInput
          balancesToShow={balances}
          onAddBadges={(balance) => {
            setBalances(deepCopyBalances([...balances, balance]));
          }}
          hideDisplay
          message='asd'
          onRemoveAll={() => {
            setBalances([]);
          }}
          increment={incrementAmount}
          setIncrement={numRecipients > 1n ? setIncrementAmount : undefined}
          numIncrements={numRecipients}
        />
      </div >
      <br />

      {
        postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0) && <div style={{ textAlign: 'center' }}>
          <WarningOutlined style={{ color: 'red' }} />
          <span style={{ marginLeft: 8, color: 'red' }}>
            You are distributing more badges than {'the sender owns'}.
          </span>
          <br />
          <br />
        </div>
      }
    </div >,
    disabled: balances.length == 0 || numRecipients <= 0 || (uintRangesOverlap || uintRangesLengthEqualsZero) || (ownedTimesOverlap || ownedTimesLengthEqualsZero) ||
      (!!postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0)),
  });

  steps.push({
    title: 'Confirm',
    description: <div className='flex-center flex-column'>
      {<div>
        {
          <TransferDisplay
            transfers={transfersToAdd}
            collectionId={collectionId}
          />
        }
      </div>}
      <br />

      <Button type='primary'
        className='full-width'
        onClick={async () => {
          setTransfers([...transfersToAdd, ...transfers]);
          setBalances([]);
          setNumRecipients(0n);
          setToAddresses([]);
          setAddTransferIsVisible(false);
          setCurrentStep(0);
          setBalances([]);
          if (setVisible) setVisible(false);
        }}>
        Add Transfer(s)
      </Button>
    </div >,
    disabled: balances.length == 0 || numRecipients <= 0 || (uintRangesOverlap || uintRangesLengthEqualsZero) || (ownedTimesOverlap || ownedTimesLengthEqualsZero) ||
      (!!postTransferBalancesWithCurrent?.find((balance) => balance.amount < 0))
  });

  const [balanceTab, setBalanceTab] = useState('remaining');

  return <>

    <div style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='primary-text'>

      {!hideRemaining && <Row style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <InformationDisplayCard title='' md={24} sm={24} xs={24} style={{ alignItems: 'normal' }} noBorder inheritBg>

          {isOffChainBalancesUpdate &&
            <div className="secondary-text">
              <InfoCircleOutlined /> Assign the badges you have created to the intended recipients. This is facilitated off-chain.
            </div>}
          <br />
          <div className='flex'>
            <InformationDisplayCard title='Balances' style={{ alignItems: 'normal' }} md={12} sm={24} xs={24} subtitle={
              <div className='flex-center'>
                <AddressDisplay
                  addressOrUsername={sender}
                />
              </div>}>
              <br />
              <Radio.Group
                buttonStyle='solid'
                onChange={(e) => {
                  setBalanceTab(e.target.value);
                }}
                value={balanceTab}
              >
                {<Radio.Button value='start'>
                  <div className='primary-text hover:text-gray-400'>
                    Start Balances
                  </div>
                </Radio.Button>}
                <Radio.Button value='remaining'><div className='primary-text hover:text-gray-400'>
                  Remaining Balances
                </div></Radio.Button>
              </Radio.Group>
              <br />
              {balanceTab === 'remaining' && <div className='secondary-text'>
                <InfoCircleOutlined /> The remaining balances after transfers are applied{addTransferIsVisible && <> (including the current transfer)</>}.
                <br />
                <br />
                <BalanceDisplay
                  hideMessage
                  collectionId={collectionId ?? NEW_COLLECTION_ID}
                  balances={postTransferBalancesWithCurrent ?? []}
                />

              </div>}


              {balanceTab === 'start' && <div className='secondary-text'>
                <InfoCircleOutlined /> {"The sender's balances before any transfers are applied."}
                <br />
                <br />
                <BalanceDisplay
                  hideMessage
                  collectionId={collectionId ?? NEW_COLLECTION_ID}
                  balances={originalSenderBalances ?? []}
                />
              </div>}
            </InformationDisplayCard>
            <InformationDisplayCard title='Added Transfers' style={{ alignItems: 'normal' }} md={12} sm={24} xs={24}>
              <>
                {[...(transfers ?? [])].length === 0 && <Empty
                  className='primary-text'
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={'None added.'} />}

                {[...(transfers ?? [])].length > 0 && <>
                  <ActivityTab
                    paginated
                    activity={transfers.map(x => {

                      return {
                        _id: `collection-${collectionId}-${x.from}-${x.toAddresses.join('-')}`,
                        from: x.from,
                        balances: x.balances,
                        collectionId: collectionId,
                        method: 'Transfer' as TransferMethod,
                        to: x.toAddresses,
                        initiatedBy: chain.address,
                        timestamp: BigInt(Date.now()),
                        block: 0n
                      }
                    }).flat()
                    }
                    fetchMore={async () => { }}
                    hasMore={false}
                    onDelete={(idx) => {
                      const newTransfers = transfers.filter((_, i) => i !== idx);
                      setTransfers(newTransfers);
                    }}
                  />
                </>}
              </>
            </InformationDisplayCard>
          </div>
          <div style={{ alignItems: 'center' }} className='primary-text full-width'>
            {
              !addTransferIsVisible && !hideTransferDisplay && <div>
                <br />
                <br />
              </div>
            }

            {
              addTransferIsVisible || setVisible ?
                <InformationDisplayCard title='Add Transfer' style={{ alignItems: 'normal' }} md={24} sm={24} xs={24}>
                  <div className='flex-between' >
                    <div></div>
                    <div>
                      <Tooltip title='Cancel' placement='bottom'>
                        <CloseOutlined
                          onClick={() => {
                            setAddTransferIsVisible(false);
                            if (setVisible) setVisible(false);
                          }}
                          style={{ fontSize: 20, cursor: 'pointer' }} className='primary-text'
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <Steps
                    current={currentStep}
                    onChange={onStepChange}
                    type='navigation'
                    className='full-width'
                  >
                    {steps.map((item, index) => (
                      <Step
                        key={index}
                        title={<b className='primary-text hover:text-vivid-blue'>{item.title}</b>}
                        disabled={(steps && steps.find((step, idx) => step.disabled && idx < index) ? true : false)}
                      />
                    ))}
                  </Steps>
                  {steps.map((item, index) => (
                    <div key={index} className='primary-text full-width'>
                      {currentStep === index && <div className='full-width'>
                        {item.description}
                      </div>}
                    </div>
                  ))}
                </InformationDisplayCard>
                : <>
                  <div className='flex-center flex-wrap'>
                    <div>
                      {plusButton ? <div className='flex-center'>
                        <IconButton
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setAddTransferIsVisible(true);
                          }}
                          src={<PlusOutlined />}
                          text='Add Transfer'
                        >
                        </IconButton>
                      </div> :
                        <div className='flex-center'>
                          <Button
                            type='primary'
                            onClick={() => {
                              setAddTransferIsVisible(true);
                            }}
                            style={{ marginTop: 20, width: '100%' }}
                          >
                            Add New Transfer
                          </Button>
                        </div>}
                    </div>
                    {fetchExisting &&
                      <div className='flex-center'>
                        <IconButton
                          style={{ cursor: 'pointer' }}
                          onClick={async () => {
                            await fetchExisting();
                          }}
                          src={<CloudSyncOutlined />}
                          text='Fetch Existing'
                        >
                        </IconButton>

                      </div>}
                    <div>
                      <IconButton
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setTransfers([]);
                        }}
                        src={<DeleteOutlined />}
                        text='Delete All'
                      >
                      </IconButton>
                    </div>
                  </div>
                </>}
          </div >



          <br />

        </InformationDisplayCard>
      </Row>}

    </div >

  </>
}