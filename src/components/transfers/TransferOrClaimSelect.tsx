import { CloseOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Collapse, Divider, Empty, Row, StepProps, Steps, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { AddressMapping, Balance, UintRange, convertBalance, convertUintRange, deepCopy } from 'bitbadgesjs-proto';
import { ApprovalCriteriaWithDetails, BigIntify, CollectionApprovalWithDetails, DistributionMethod, MerkleChallengeDetails, MerkleChallengeWithDetails, Numberify, TransferWithIncrements, checkIfUintRangesOverlap, convertToCosmosAddress, filterZeroBalances, getBalancesAfterTransfers, getBalancesForIds, getReservedAddressMapping, removeUintRangeFromUintRange } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useRef, useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { MSG_PREVIEW_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { BalanceBeforeAndAfter } from '../badges/balances/BalanceBeforeAndAfter';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { BalanceAmountInput } from '../inputs/BalanceAmountInput';
import { BalanceInput } from '../inputs/BalanceInput';
import { NumberInput } from '../inputs/NumberInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { ClaimCodesSelectStep } from './ClaimCodesSelectStep';
import { ClaimMetadataSelectSelectStep } from './ClaimMetadataSelectStep';
import { ClaimNumPerAddressSelectStep } from './ClaimNumPerAddressSelectStep';
import { ClaimTimeRangeSelectStep } from './ClaimTimeRangeSelectStep';
import { OrderMattersSelectStepItem } from './OrderMattersSelectStep';
import { RecipientsSelectStep } from './RecipientsSelectStep';
import { TransferDisplay } from './TransferDisplay';

const crypto = require('crypto');
const { Text } = Typography;

const { Step } = Steps;

export enum AmountSelectType {
  None,
  Custom,
  Increment,
}

export enum CodeType {
  None,
  Unique,
  Reusable
}
//export TransferSelect with alias of ClaimSelect
export { TransferSelect as ClaimSelect };

//TODO: There is a weird flash going from increments to custom (standard) because it tries to display the BalanceDisplay with all the balances w/ increments (x1 of 1, x1 of 2, etc) 
//before updating the balances / increment to be len == 1

export function TransferSelect({
  transfers,
  setTransfers,
  collectionId,
  plusButton,
  setVisible,
  sender,
  originalSenderBalances,
  distributionMethod,
  hideTransferDisplay,
  approvalsToAdd,
  setApprovalsToAdd,
  hideRemaining,
  isApprovalSelect,
}: {
  transfers?: (TransferWithIncrements<bigint>)[],
  setTransfers?: (transfers: (TransferWithIncrements<bigint>)[]) => void;
  sender: string,
  approvalsToAdd?: ((CollectionApprovalWithDetails<bigint>))[],
  setApprovalsToAdd?: (claims: ((CollectionApprovalWithDetails<bigint>))[]) => void;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  originalSenderBalances: Balance<bigint>[];
  plusButton?: boolean;
  hideRemaining?: boolean;
  isApprovalSelect?: boolean;
  setVisible?: (visible: boolean) => void;
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const doNotUseTransferWithIncrements = distributionMethod === DistributionMethod.DirectTransfer ? true : false;

  const isClaimSelect = distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe || distributionMethod === DistributionMethod.Whitelist ? true : false;
  const isTransferSelect = !isClaimSelect;
  if (!isClaimSelect && !isTransferSelect) throw new Error('Must be either claims or transfers select');

  const [clicked, setClicked] = useState(false);
  const [numRecipients, setNumRecipients] = useState<bigint>(0n);
  const [increment, setIncrement] = useState<bigint>(0n);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [postTransferBalances, setPostTransferBalance] = useState<Balance<bigint>[]>();
  const [preTransferBalances, setPreTransferBalance] = useState<Balance<bigint>[]>();
  const [amountSelectType, setAmountSelectType] = useState(AmountSelectType.None);
  const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currPage, setCurrPage] = useState(1);
  const [orderMatters, setOrderMatters] = useState(false);

  //For the current transfer we are going to add (we also use these fields to calculate the claim amounts and badges)
  const [balances, setBalances] = useState<Balance<bigint>[]>(originalSenderBalances.map((x) => convertBalance(x, BigIntify)));
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [transfersToAdd, setTransfersToAdd] = useState<TransferWithIncrements<bigint>[]>([]);

  const challengeId = useRef(crypto.randomBytes(32).toString('hex'));
  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));

  //Claim information - Not used if transfer select
  const [claimDetails, setClaimDetails] = useState<MerkleChallengeDetails<bigint>>({
    name: '',
    description: '',
    hasPassword: false,
    challengeDetails: {
      leavesDetails: {
        leaves: [],
        isHashed: false,
      },
    }
  });

  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours() + 1);
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  const [claimTimeRange, setClaimTimeRange] = useState<UintRange<bigint>[]>([{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 365), }]);
  const [claimPassword, setClaimPassword] = useState('');

  const [numClaimsPerInitiatedByAddress, setNumClaimsPerInitiatedByAddress] = useState<bigint>(1n);
  const [numPerToAddress, setNumPerToAddress] = useState<bigint>(0n);
  const [requireToEqualsInitiatedBy, setRequireToEqualsInitiatedBy] = useState(true);
  // const [requireToDoesNotEqualInitiatedBy, setRequireToDoesNotEqualInitiatedBy] = useState(false);
  const requireToDoesNotEqualInitiatedBy = false;

  //Whenever something changes, update the pre and post transfer balances
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: convert transfers');
    let convertedTransfers = transfers ?? [];

    //Calculate from beginning
    let postTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));
    let preTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));

    if (!postTransferBalanceObj || postTransferBalanceObj.length == 0) return;
    if (!preTransferBalanceObj || preTransferBalanceObj.length == 0) return;

    preTransferBalanceObj = getBalancesAfterTransfers(preTransferBalanceObj, [...convertedTransfers], true);
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...convertedTransfers], true);
    //Deduct transfers to add

    let currBalancesForSelectedBadges = getBalancesForIds(balances.map(x => x.badgeIds).flat(), [{ start: 1n, end: GO_MAX_UINT_64 }], postTransferBalanceObj);
    currBalancesForSelectedBadges = filterZeroBalances(currBalancesForSelectedBadges);

    // postTransferBalanceObj = subtractBalances(currBalancesForSelectedBadges, postTransferBalanceObj);
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...transfersToAdd], true);


    setPostTransferBalance(postTransferBalanceObj);
    setPreTransferBalance(preTransferBalanceObj);
  }, [transfersToAdd, originalSenderBalances, transfers, isClaimSelect, isTransferSelect, approvalsToAdd, amountTrackerId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: transfer or claim select, check warnings');
    //Generate any error or warning messages for undistributed or overflowing badge amounts
    const checkForErrorsAndWarnings = () => {
      let errorMessage = '';
      let warningMessage = '';
      for (const balance of balances) {
        for (const badgeUintRange of balance.badgeIds) {
          if ((badgeUintRange.start + (increment * numRecipients) - 1n) > badgeUintRange.end) {
            errorMessage = `You are attempting to distribute badges you didn't previously select (IDs  ${balance.badgeIds.map((range) => {
              if ((range.start + (increment * numRecipients) - 1n) > range.end) {
                return `${range.end + 1n}-${range.start + (increment * numRecipients) - 1n}`;
              } else {
                return undefined;
              }
            }).filter(x => !!x).join(', ')}).`;
          } else if ((badgeUintRange.start + (increment * numRecipients) - 1n) < badgeUintRange.end) {
            warningMessage = `The following badges will not be distributed due to only ${numRecipients} possible recipients: IDs ${balance.badgeIds.map((range) => {
              if ((range.start + (increment * numRecipients) - 1n) < range.end) {
                return `${range.start + (increment * numRecipients)}-${range.end}`;
              } else {
                return undefined;
              }
            }).filter(x => !!x).join(', ')}.`;
          } else if (postCurrTransferBalances.length > 0) {
            warningMessage = `You must have no remaining badges for the selected badge IDs.`
          }
        }
      }
      setErrorMessage(errorMessage);
      setWarningMessage(warningMessage);
    }

    if (numRecipients === 0n) return;

    const incrementIsSelected = amountSelectType === AmountSelectType.Increment;
    let newTransfersToAdd: TransferWithIncrements<bigint>[] = [];

    //We have a couple combinations here
    //1. Normal transfer - no increments, can be used with everything (codes, direct transfers, whitelist, etc)
    //2. Increment IDs after every claim/transfer - for claims (whitelist, code, etc.), this supports numIncrements / incrementBadgeIdsBy, but for direct transfers, we need to add N unique transfers with each increment manually added

    // If we are not using increments at all, then we can just add the transfers as is (normal transfer)
    if (!incrementIsSelected) {
      newTransfersToAdd = [{
        toAddresses: toAddresses,
        balances: balances,
        toAddressesLength: isClaimSelect ? numRecipients : undefined,
        from: sender,
        precalculateBalancesFromApproval: {
          approvalId: '',
          approvalLevel: "",
          approverAddress: ""
        },
        merkleProofs: [],
        memo: "",
        prioritizedApprovals: [],
        onlyCheckPrioritizedApprovals: false,
      }];
    } else if (amountSelectType === AmountSelectType.Increment) {
      let numPerAddress = increment;

      checkForErrorsAndWarnings();

      const currBadgeIds: UintRange<bigint>[] = [];
      const currOwnershipTimes: UintRange<bigint>[] = [];
      for (const balance of balances) {
        for (const badgeUintRange of balance.badgeIds) {
          currBadgeIds.push(convertUintRange(badgeUintRange, BigIntify));
        }

        for (const ownershipTimeUintRange of balance.ownershipTimes) {
          currOwnershipTimes.push(convertUintRange(ownershipTimeUintRange, BigIntify));
        }
      }

      //If we are using increments and directly transferring (doNotUseTransferWithIncrements = true), then we need to add N unique transfers with each increment manually added
      if (doNotUseTransferWithIncrements) {
        //Not used currently. Visit past Git for implementation
      } else {
        //Else, we can just add the transfer with increments and it'll be handled
        newTransfersToAdd.push({
          toAddresses: toAddresses,
          balances: balances.map(x => {
            return {
              ...x,
              badgeIds: x.badgeIds.map((badgeUintRange) => {
                return {
                  start: badgeUintRange.start,
                  end: badgeUintRange.start + increment - 1n,
                }
              }),
            }
          }),
          toAddressesLength: isClaimSelect ? numRecipients : undefined,
          incrementBadgeIdsBy: numPerAddress,
          from: sender,
          precalculateBalancesFromApproval: {
            approvalId: "",
            approvalLevel: "",
            approverAddress: ""
          },
          merkleProofs: [],
          memo: "",
          prioritizedApprovals: [],
          onlyCheckPrioritizedApprovals: false,
        });
      }
    }

    setTransfersToAdd(newTransfersToAdd);
  }, [balances, numRecipients, increment, amountSelectType, toAddresses, doNotUseTransferWithIncrements, amountTrackerId]);


  const approvalToAdd: (CollectionApprovalWithDetails<bigint> & {
    approvalCriteria: ApprovalCriteriaWithDetails<bigint>
  }) = {
    fromMappingId: sender,
    fromMapping: getReservedAddressMapping(sender) as AddressMapping,
    toMappingId: "AllWithMint",
    toMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    initiatedByMappingId: "AllWithMint",
    initiatedByMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    transferTimes: claimTimeRange,
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: balances.map(x => x.badgeIds).flat(),
    approvalId: amountTrackerId.current,
    amountTrackerId: amountTrackerId.current,
    challengeTrackerId: challengeId.current.toString(),
    approvalCriteria: {
      mustOwnBadges: [],
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
      },
      maxNumTransfers: {
        overallMaxNumTransfers: numRecipients,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: numPerToAddress,
        perInitiatedByAddressMaxNumTransfers: (distributionMethod === DistributionMethod.Codes && claimPassword)
          ? 1n : numClaimsPerInitiatedByAddress,
      },
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: balances.map((balance) => {
            if (!increment || amountSelectType !== AmountSelectType.Increment) return balance;

            return {
              amount: balance.amount,
              badgeIds: balance.badgeIds.map((uintRange) => {
                return {
                  start: uintRange.start,
                  end: uintRange.start + increment - 1n,
                }
              }),
              ownershipTimes: balance.ownershipTimes,
            }
          }),
          incrementBadgeIdsBy: increment,
          incrementOwnershipTimesBy: 0n,
        },
        orderCalculationMethod: {
          useMerkleChallengeLeafIndex: orderMatters,
          useOverallNumTransfers: !orderMatters,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          usePerToAddressNumTransfers: false,
        },
      },
      merkleChallenge: {
        root: '',
        expectedProofLength: 0n,
        details: claimDetails,
        useCreatorAddressAsLeaf: false,
        maxOneUsePerLeaf: true,
        uri: '',
        customData: '',

      }, //handled later
      requireToEqualsInitiatedBy: requireToEqualsInitiatedBy,
      requireFromEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: requireToDoesNotEqualInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: false,


      overridesToIncomingApprovals: false,
      overridesFromOutgoingApprovals: true,
    }
  };

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  let totalNumBadges = 0n;
  for (const balance of balances) {
    for (const badgeUintRange of balance.badgeIds) {
      totalNumBadges += badgeUintRange.end - badgeUintRange.start + 1n;
    }
  }

  let convertedTransfers = transfers ?? [];

  const postCurrTransferBalances = postTransferBalances?.map((balance) => {
    const [, removed] = removeUintRangeFromUintRange(balances.map(x => x.badgeIds).flat(), balance.badgeIds);
    return {
      ...balance,
      badgeIds: removed,
    }
  }).filter(x => x.badgeIds.length > 0) ?? [];

  const preCurrTransferBalance = preTransferBalances?.map((balance) => {
    const [, removed] = removeUintRangeFromUintRange(balances.map(x => x.badgeIds).flat(), balance.badgeIds);
    return {
      ...balance,
      badgeIds: removed,
    }
  }).filter(x => x.badgeIds.length > 0) ?? [];


  const uintRangesOverlap = checkIfUintRangesOverlap(balances[0]?.badgeIds || []);
  const uintRangesLengthEqualsZero = balances[0]?.badgeIds.length === 0;

  //We have five potential steps
  //1. Select recipients, number of codes, max number of claims depending on distribution method
  //2. Select badges to distribute
  //3. Select amount to distribute
  //4. Select time range (if claim)
  //5. Review and confirm
  const steps: StepProps[] = [];

  const claimCodesSelectStepWithPassword = ClaimCodesSelectStep(distributionMethod, setNumRecipients, claimPassword, setClaimPassword);
  const claimCodesSelectStepWithoutPassword = ClaimCodesSelectStep(distributionMethod, setNumRecipients);
  const recipientsSelect = RecipientsSelectStep({
    sender: sender,
    // collectionId: collectionId,
    // senderBalance: originalSenderBalances,
    setNumRecipients,
    toAddresses: toAddresses,
    setToAddresses: setToAddresses,
  });

  //Add first step (calculating number of recipients and who the recipients are in the case of a typical transfer)
  if (isApprovalSelect) {

  } else if (distributionMethod === DistributionMethod.Codes) {
    steps.push(claimCodesSelectStepWithPassword);
  } else if (distributionMethod === DistributionMethod.FirstComeFirstServe) {
    steps.push(claimCodesSelectStepWithoutPassword);
  } else {
    steps.push(recipientsSelect);
  }

  //Add second step
  steps.push({
    title: 'Badges',
    description: <div>
      <br />

      <BalanceInput
        balancesToShow={balances}
        onAddBadges={(balance) => {
          setBalances([...balances, balance]);
        }}
        onRemoveAll={() => {
          setBalances([]);
        }}
        minimum={1n}
        maximum={collection ? getTotalNumberOfBadges(collection) : 0n}
        collectionId={collectionId}
      />
      {isClaimSelect && <>
        <br />
        <div className='flex-center'>
          <InfoCircleOutlined /> <span style={{ marginLeft: 8 }}>This step selects the allocated balances for ALL claims combined. The next step will allow you to customize the per-claim balances.</span>
        </div>
      </>}
    </div>,
    disabled: uintRangesOverlap || uintRangesLengthEqualsZero,
  });

  //Add third step
  steps.push({
    title: 'Amounts',
    description: <div>
      {numRecipients > 1 && <div>
        {balances[0]?.badgeIds && (increment ? increment : 0) >= 0 && setIncrement && <div>
          {numRecipients > 1 && <div>

            <SwitchForm
              options={[{
                title: 'Standard',
                message: `No increments. All badge IDs will be sent to all ${numRecipients} recipients.`,
                isSelected: amountSelectType === AmountSelectType.Custom,
              },
              {
                title: 'Increments',
                message: `The first recipient will receive an initial subset of the badge IDs selected. After each claim, the badge IDs will increment by X before the next recipient claims.`,
                isSelected: amountSelectType === AmountSelectType.Increment,
              }]}
              onSwitchChange={(option, _title) => {
                setClicked(true);
                if (option === 0) {
                  setIncrement(0n);
                  setErrorMessage('');
                  setWarningMessage('');
                  setAmountSelectType(AmountSelectType.Custom);

                } else {
                  setIncrement(1n);
                  setAmountSelectType(AmountSelectType.Increment);

                }
              }}
            />
          </div>}



          {amountSelectType === AmountSelectType.Increment && < div >
            <NumberInput
              value={increment ? Numberify(increment.toString()) : 0}
              setValue={(value) => {
                setIncrement(BigInt(value));
              }}
              min={1}
              title="Increment"
            />

            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

              <div>
                <div style={{ marginLeft: 8 }}>
                  {increment === 0n && 'All recipients will receive all of the previously selected badge IDs.'}
                  {increment ? `The first claim will correspond to the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start}${increment > 1 ? `-${start + increment - 1n}` : ''}`).join(', ')}.` : ''}
                </div>
                <div style={{ marginLeft: 8 }}>

                  {increment ? `The second claim will correspond to the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start + increment}${increment > 1 ? `-${start + increment + increment - 1n}` : ''}`).join(', ')}.` : ''}

                </div>

                {numRecipients > 3 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `...` : ''}
                  </div>
                </div>}
                {numRecipients > 2 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `The ${numRecipients === 3n ? 'third' : numRecipients + 'th'} claim will correspond to the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start + (numRecipients - 1n) * increment}${increment > 1 ? `-${start + (numRecipients - 1n) * increment + increment - 1n}` : ''}`).join(', ')}.` : ''}
                  </div>
                </div>}
              </div>
            </div>
            {increment !== 0n && increment !== totalNumBadges / numRecipients && <div style={{ textAlign: 'center' }}>
              <br />
              {warningMessage &&
                <div style={{ textAlign: 'center' }}>
                  <div>
                    <WarningOutlined style={{ color: 'orange' }} />
                    <span style={{ marginLeft: 8, color: 'orange' }}>
                      {warningMessage}
                    </span>
                  </div>
                </div>

              }
              {errorMessage &&
                <div style={{ textAlign: 'center' }}>
                  <WarningOutlined style={{ color: 'red' }} />
                  <span style={{ marginLeft: 8, color: 'red' }}>
                    {errorMessage}
                  </span>
                </div>
              }
              <br />
            </div>}

            <hr />
          </div>}

        </div>}

      </div>
      }

      <br />
      {postTransferBalances?.find((balance) => balance.amount < 0) && <div style={{ textAlign: 'center' }}>
        <WarningOutlined style={{ color: 'red' }} />
        <span style={{ marginLeft: 8, color: 'red' }}>
          You are distributing more badges than {isClaimSelect ? 'you have created' : 'the sender owns'}.
        </span>
        <br />
        <br />
      </div>
      }
      {numRecipients > 1 && !clicked ? <></> : <><div>
        <BalanceAmountInput
          title={isClaimSelect ? 'Per-Claim Amount Transferred' : 'Amount Transferred'}
          balances={balances}
          setBalances={setBalances}
        />

        {(numRecipients <= 1 || amountSelectType === AmountSelectType.Custom) && <div>
          {/* <hr /> */}
          <TransferDisplay
            transfers={transfersToAdd}
            collectionId={collectionId}
            hideAddresses
          />
        </div>}
        {isTransferSelect && <>
          <Divider />
          <div className='flex-center'>
            {
              postCurrTransferBalances.length > 0 && <div>
                <WarningOutlined style={{}} />
                <span style={{ marginLeft: 8, }}>
                  Any balances remaining will remain undistributed.
                </span>
                <Divider />
              </div>
            }
          </div>
          {
            postTransferBalances && <div>
              <BalanceBeforeAndAfter collectionId={collectionId}
                balances={(preCurrTransferBalance ? preCurrTransferBalance : originalSenderBalances)}
                newBalances={postCurrTransferBalances}
                partyString='' beforeMessage='Before Transfer Is Added'
                afterMessage='After Transfer Is Added'
              />
            </div>
          }</>}
      </div></>}
    </div >,
    disabled: balances.length == 0 ||
      (!!postTransferBalances?.find((balance) => balance.amount < 0)) ||
      errorMessage ? true : false,
  });

  //Add time select step
  const orderMattersStepItem = OrderMattersSelectStepItem(orderMatters, setOrderMatters, distributionMethod);
  const claimNumPerAddressStep = ClaimNumPerAddressSelectStep(
    numClaimsPerInitiatedByAddress, setNumClaimsPerInitiatedByAddress,
    numPerToAddress,
    setNumPerToAddress,
    requireToEqualsInitiatedBy,
    setRequireToEqualsInitiatedBy,
    // requireToDoesNotEqualInitiatedBy,
    // setRequireToDoesNotEqualInitiatedBy,

    distributionMethod, false)
  const claimTimeRangeStep = ClaimTimeRangeSelectStep(claimTimeRange, setClaimTimeRange);
  const claimMetadataStep = ClaimMetadataSelectSelectStep(claimDetails, setClaimDetails);

  if (isClaimSelect) {
    if (distributionMethod === DistributionMethod.FirstComeFirstServe || (distributionMethod === DistributionMethod.Codes && !claimPassword)) {
      steps.push(claimNumPerAddressStep);
    }
    if ((distributionMethod === DistributionMethod.Whitelist && amountSelectType === AmountSelectType.Increment)
      || (distributionMethod === DistributionMethod.Codes && !claimPassword && amountSelectType === AmountSelectType.Increment)
    ) {
      steps.push(orderMattersStepItem);
    }

    steps.push(claimTimeRangeStep);

    //We can eventually support this but currently, we store name/description tied to the merkleChallenge so first come first serve doesn't have a merkleChallenge and won't work
    if (distributionMethod !== DistributionMethod.FirstComeFirstServe) {
      steps.push(claimMetadataStep);
    }
  }

  steps.push({
    title: 'Confirm',
    description: <div className='flex-center flex-column'>
      {!isApprovalSelect && <div>
        {isClaimSelect ? <div>
          <ClaimDisplay
            approval={approvalToAdd}
            approvalCriteria={approvalToAdd.approvalCriteria}
            collectionId={collectionId}
          />
        </div> :
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
          if (isTransferSelect && setTransfers && transfers) {
            setTransfers([...transfers, ...transfersToAdd]);
            setBalances([]);
            // setBalances([]);
          } else if (isClaimSelect && setApprovalsToAdd && approvalsToAdd) {
            //Set them here
            const codes = [];
            const addresses = [];


            if (distributionMethod === DistributionMethod.Codes) {
              for (let i = 0; i < numRecipients; i++) {
                const code = crypto.randomBytes(32).toString('hex');
                codes.push(code);
              }

              const hashedCodes = codes.map(x => SHA256(x).toString());
              const codesTree = new MerkleTree(hashedCodes, SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
              const codesRoot = codesTree.getRoot().toString('hex');

              const merkleChallenge: any = {};
              merkleChallenge.root = codesRoot ? codesRoot : '';
              merkleChallenge.expectedProofLength = BigInt(codesTree.getLayerCount() - 1);
              merkleChallenge.useCreatorAddressAsLeaf = false;
              merkleChallenge.maxOneUsePerLeaf = true;
              merkleChallenge.details = claimDetails;
              merkleChallenge.details.challengeDetails.leavesDetails.leaves = hashedCodes;
              merkleChallenge.details.challengeDetails.leavesDetails.isHashed = true;
              merkleChallenge.details.challengeDetails.leavesDetails.preimages = codes;
              merkleChallenge.details.challengeDetails.numLeaves = BigInt(numRecipients);
              merkleChallenge.details.challengeDetails.password = claimPassword;
              merkleChallenge.details.challengeDetails.hasPassword = claimPassword ? true : false;

              approvalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>
            } else if (distributionMethod === DistributionMethod.Whitelist) {
              addresses.push(...toAddresses.map(x => convertToCosmosAddress(x)));

              const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
              const addressesRoot = addressesTree.getRoot().toString('hex');

              const merkleChallenge: any = {};
              merkleChallenge.root = addressesRoot ? addressesRoot : '';
              merkleChallenge.expectedProofLength = BigInt(addressesTree.getLayerCount() - 1);
              merkleChallenge.useCreatorAddressAsLeaf = true;
              merkleChallenge.maxOneUsePerLeaf = false;
              merkleChallenge.details = claimDetails;
              merkleChallenge.details.challengeDetails.leavesDetails.leaves = addresses
              merkleChallenge.details.challengeDetails.leavesDetails.isHashed = false;
              merkleChallenge.details.challengeDetails.numLeaves = BigInt(numRecipients);
              merkleChallenge.details.challengeDetails.password = ''
              merkleChallenge.details.challengeDetails.hasPassword = false;

              approvalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>
            } else {
              // approvalToAdd.approvalCriteria.merkleChallenge.details = claimDetails;
              // approvalToAdd.approvalCriteria.merkleChallenge.details.password = ''
              // approvalToAdd.approvalCriteria.merkleChallenge.details.hasPassword = false;
              approvalToAdd.approvalCriteria.merkleChallenge = {
                root: '',
                maxOneUsePerLeaf: false,
                expectedProofLength: 0n,
                useCreatorAddressAsLeaf: false,
                details: undefined,
                uri: '',
                customData: '',
              }
            }




            approvalToAdd.badgeIds = deepCopy(balances).map(x => x.badgeIds).flat();
            approvalToAdd.ownershipTimes = deepCopy(balances).map(x => x.ownershipTimes).flat();

            setApprovalsToAdd([...approvalsToAdd, approvalToAdd]);
          }
          setNumRecipients(0n);
          setToAddresses([]);
          setAmountSelectType(AmountSelectType.None);
          setIncrement(0n);
          setAddTransferIsVisible(false);
          setCurrentStep(0);
          setBalances([]);
          if (setVisible) setVisible(false);
        }}>
        Add Transfer(s)
      </Button>
      {distributionMethod === DistributionMethod.Codes && !claimDetails?.password &&
        <div className='flex-center secondary-text full-width'>
          <h5 className='primary-text'>Once this collection has been created, distribute the codes via the Claims tab.</h5>
        </div>}
    </div >,
    disabled: false
  });


  return <>

    <div style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='primary-text'>

      {!hideRemaining && isTransferSelect && <Row style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <Col md={11} sm={24} xs={24} className='flex-center'>
          <InformationDisplayCard
            title='Remaining'
            noBorder
          >
            {preTransferBalances && preTransferBalances.length > 0 &&
              <BadgeAvatarDisplay
                collectionId={collectionId ?? MSG_PREVIEW_ID}
                badgeIds={preTransferBalances.map(x => x.badgeIds).flat()}
                showIds
              />}
            {/* // <BalanceDisplay
              //   collectionId={collectionId ?? MSG_PREVIEW_ID}
              //   balances={preTransferBalances}
              // />} */}
            {(!preTransferBalances || preTransferBalances.length === 0) && <Empty
              className='primary-text'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No badges left remaining.'
            />}
          </InformationDisplayCard>
        </Col>

        <Col md={11} sm={24} xs={24} className='flex-center full-width'>
          <InformationDisplayCard
            title={<>Added Transfers</>}
            noBorder
            span={24}
          >
            <>
              {[...(transfers ?? [])].length === 0 && <Empty
                className='primary-text'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={distributionMethod === DistributionMethod.Codes ? 'No codes generated.' : distributionMethod === DistributionMethod.Whitelist ? 'No users added.' : 'No claims added.'} />}

              {[...(transfers ?? [])].length > 0 && <>

                <div className='flex-center'>
                  <Pagination currPage={currPage} onChange={setCurrPage} total={[...(transfers ?? [])].length} pageSize={1} />
                </div>
                <Collapse accordion className='primary-text inherit-bg full-width' style={{ margin: 0 }}>
                  {[...(transfers ?? [])].map((_, index) => {
                    if (index < (currPage - 1) * 10 || index >= currPage * 10) {
                      return <></>
                    }

                    return <CollapsePanel
                      header={
                        <div className='primary-text full-width' style={{ margin: 0, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                            <Text strong className='primary-text'>
                              {index + 1}. {distributionMethod}
                            </Text>
                          </div>

                          <div>
                            <Tooltip title='Delete'>
                              <DeleteOutlined onClick={
                                () => {
                                  if (isTransferSelect && setTransfers && transfers) setTransfers(transfers.filter((_, i) => i !== index));
                                }
                              } />
                            </Tooltip>
                          </div>
                        </div>
                      }
                      key={index}
                      className='primary-text inherit-bg full-width'
                    >
                      <div className='flex-center flex-column full-width'>
                        {isTransferSelect && <div className='primary-text inherit-bg' >
                          <TransferDisplay
                            collectionId={collectionId}
                            transfers={convertedTransfers}
                          />
                          <Divider />
                        </div>}
                      </div>
                    </CollapsePanel>
                  })}
                </Collapse>
                <Divider />
              </>}
            </>
          </InformationDisplayCard>
        </Col>
      </Row>}

    </div >
    <br />
    <div style={{ alignItems: 'center' }} className='primary-text full-width'>
      {
        !addTransferIsVisible && !hideTransferDisplay && <div>
          <br />
          <br />
        </div>
      }

      {
        addTransferIsVisible || setVisible ?
          <div className='full-width'>
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
                  title={<b>{item.title}</b>}
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
          </div>
          : <>
            {plusButton ? <div className='flex-center'>
              <Avatar
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setAddTransferIsVisible(true);
                }}
                src={<PlusOutlined />}
                className='styled-button'
              >
              </Avatar>
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

          </>}
      <br />
    </div >
  </>
}