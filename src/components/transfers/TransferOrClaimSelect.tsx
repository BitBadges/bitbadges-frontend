import { CloseOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Collapse, Divider, Empty, Row, StepProps, Steps, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { AddressMapping, Balance, UintRange, convertBalance, convertUintRange } from 'bitbadgesjs-proto';
import { BigIntify, CollectionApprovedTransferWithDetails, DistributionMethod, MerkleChallengeDetails, Numberify, TransferWithIncrements, checkIfUintRangesOverlap, getBalancesAfterTransfers, getCurrentValueIdxForTimeline, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useRef, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../constants';
import { FOREVER_DATE } from '../../utils/dates';
import { BalanceBeforeAndAfter } from '../badges/balances/BalanceBeforeAndAfter';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { BalancesInput } from '../badges/balances/BalancesInput';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { NumberInput } from '../display/NumberInput';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { BalanceInput } from '../tx-timelines/form-items/BalanceInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { ClaimCodesSelectStep } from './ClaimCodesSelectStep';
import { ClaimMetadataSelectSelectStep } from './ClaimMetadataSelectStep';
import { ClaimNumPerAddressSelectStep } from './ClaimNumPerAddressSelectStep';
import { ClaimTimeRangeSelectStep } from './ClaimTimeRangeSelectStep';
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
  sender,
  originalSenderBalances,
  distributionMethod,
  hideTransferDisplay,
  approvedTransfersToAdd,
  setApprovedTransfersToAdd,
}: {
  transfers?: (TransferWithIncrements<bigint>)[],
  setTransfers?: (transfers: (TransferWithIncrements<bigint>)[]) => void;
  sender: string,
  approvedTransfersToAdd?: ((CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] }))[],
  setApprovedTransfersToAdd?: (claims: ((CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] }))[]) => void;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  originalSenderBalances: Balance<bigint>[];
  plusButton?: boolean;
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const accounts = useAccountsContext();
  const doNotUseTransferWithIncrements = distributionMethod === DistributionMethod.DirectTransfer ? true : false;

  const isClaimSelect = distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe || distributionMethod === DistributionMethod.Whitelist ? true : false;
  const isTransferSelect = !isClaimSelect;
  if (!isClaimSelect && !isTransferSelect) throw new Error('Must be either claims or transfers select');

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

  //For the current transfer we are going to add (we also use these fields to calculate the claim amounts and badges)
  const [balances, setBalances] = useState<Balance<bigint>[]>(originalSenderBalances.map((x) => convertBalance(x, BigIntify)));
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [transfersToAdd, setTransfersToAdd] = useState<TransferWithIncrements<bigint>[]>([]);


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

  const [claimTimeRange, setClaimTimeRange] = useState<UintRange<bigint>>({ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 365), });
  const [claimPassword, setClaimPassword] = useState('');
  const [numClaimsPerAddress, setNumClaimsPerAddress] = useState<bigint>(1n);

  const approvedTransfersForClaims = [];
  const merkleChallenges = [];


  const currentApprovedTransfers = [];
  const currIdx = getCurrentValueIdxForTimeline(collection?.collectionApprovedTransfersTimeline ?? []);
  if (collection?.collectionApprovedTransfersTimeline && currIdx >= 0) {
    currentApprovedTransfers.push(...collection.collectionApprovedTransfersTimeline[Number(currIdx)].collectionApprovedTransfers);
  }

  for (const approvedTransfer of currentApprovedTransfers) {
    for (const approvalDetails of approvedTransfer.approvalDetails) {
      for (const merkleChallenge of approvalDetails.merkleChallenges) {
        merkleChallenges.push(merkleChallenge);
        approvedTransfersForClaims.push(approvedTransfer);
      }
    }
  }

  const numActiveClaims = approvedTransfersForClaims.length;

  const challengeId = useRef(crypto.randomBytes(32).toString('hex'));

  const approvalId = useRef(crypto.randomBytes(32).toString('hex'));
  const approvedTransferToAdd: (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] }) = {
    fromMappingId: sender,
    fromMapping: getReservedAddressMapping(sender, "") as AddressMapping,
    toMappingId: "AllWithMint",
    toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    initiatedByMappingId: "AllWithMint",
    initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    transferTimes: [claimTimeRange],
    ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
    badgeIds: balances.map(x => x.badgeIds).flat(),
    allowedCombinations: [{
      initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
      fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
      toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
      badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
      ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
      transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
      isApproved: true,
    }],
    approvalDetails: [{
      approvalId: approvalId.current,
      uri: '',
      customData: '',
      mustOwnBadges: [],
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: (distributionMethod === DistributionMethod.Codes && claimPassword)
          ? 1n : numClaimsPerAddress,
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
          useMerkleChallengeLeafIndex: false,
          useOverallNumTransfers: true,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          usePerToAddressNumTransfers: false,
        },
      },
      merkleChallenges: [{
        root: '',
        expectedProofLength: 0n,
        details: claimDetails,
        useCreatorAddressAsLeaf: false,
        useLeafIndexForTransferOrder: false,
        maxOneUsePerLeaf: true,
        uri: '',
        customData: '',
        challengeId: challengeId.current.toString(),
      }], //handled later
      requireToEqualsInitiatedBy: false,
      requireFromEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,


      overridesToApprovedIncomingTransfers: false,
      overridesFromApprovedOutgoingTransfers: true,
    }],

    balances: balances,
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
  if (isClaimSelect) {
    convertedTransfers = approvedTransfersToAdd?.map((claim) => {
      return {
        toAddresses: [],
        toAddressesLength: 1n,
        balances: claim.balances,
        from: sender,
        precalculationDetails: {
          approvalId: approvalId.current,
          approvalLevel: "collection",
          approverAddress: ""
        },

        merkleProofs: [],
        memo: "",
      }
    }) || [];
  }

  //Reset the balances whenever the sender balance changes
  // useEffect(() => {
  // if (INFINITE_LOOP_MODE) console.log('useEffect: ');
  //   console.log("Original sender balances changed");
  //   setBalances(originalSenderBalances.map((balance) => convertBalance(balance, BigIntify)));
  // }, [originalSenderBalances]);

  //Whenever something changes, update the pre and post transfer balances
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: convert transfers');
    let convertedTransfers = transfers ?? [];
    if (isClaimSelect) {
      convertedTransfers = approvedTransfersToAdd?.map((claim) => {
        return {
          toAddresses: [],
          toAddressesLength: 1n,
          balances: claim.balances,
          from: sender,
          precalculationDetails: {
            approvalId: approvalId.current,
            approvalLevel: "collection",
            approverAddress: ""
          },

          merkleProofs: [],
          memo: "",
        }
      }) || [];
    }

    //Calculate from beginning
    let postTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));
    let preTransferBalanceObj = originalSenderBalances.map((x) => convertBalance(x, BigIntify));

    if (!postTransferBalanceObj || postTransferBalanceObj.length == 0) return;
    if (!preTransferBalanceObj || preTransferBalanceObj.length == 0) return;

    preTransferBalanceObj = getBalancesAfterTransfers(preTransferBalanceObj, [...convertedTransfers], true);
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...convertedTransfers], true);
    //Deduct transfers to add
    postTransferBalanceObj = getBalancesAfterTransfers(postTransferBalanceObj, [...transfersToAdd], true);


    setPostTransferBalance(postTransferBalanceObj);
    setPreTransferBalance(preTransferBalanceObj);
  }, [transfersToAdd, originalSenderBalances, transfers, isClaimSelect, isTransferSelect, approvedTransfersToAdd, approvalId]);

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
            warningMessage = `The following badges are included in the claim but will not be distributed: IDs ${balance.badgeIds.map((range) => {
              if ((range.start + (increment * numRecipients) - 1n) < range.end) {
                return `${range.start + (increment * numRecipients)}-${range.end}`;
              } else {
                return undefined;
              }
            }).filter(x => !!x).join(', ')}.`;
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
        toAddressesLength: numRecipients,
        from: sender,
        precalculationDetails: {
          approvalId: approvalId.current,
          approvalLevel: "collection",
          approverAddress: ""
        },
        merkleProofs: [],
        memo: "",
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
        //TODO: Not used but also not correct
        //Add N transfers, each with a different increment
        for (let i = 0; i < numRecipients; i++) {
          newTransfersToAdd.push({
            toAddresses: [toAddresses[i]],
            balances: [{
              amount: balances[0]?.amount || 1n,
              badgeIds: currBadgeIds.map((badgeUintRange) => convertUintRange(badgeUintRange, BigIntify)),
              ownershipTimes: currOwnershipTimes.map((ownershipTimeUintRange) => convertUintRange(ownershipTimeUintRange, BigIntify)),
            }],
            from: sender,
            precalculationDetails: {
              approvalId: approvalId.current,
              approvalLevel: "collection",
              approverAddress: ""
            },
            merkleProofs: [],
            memo: "",
          });

          //Increment the badge IDs for the next transfer
          for (let j = 0; j < currBadgeIds.length; j++) {
            currBadgeIds[j].start += increment;
            currBadgeIds[j].end += increment;
          }

          for (let j = 0; j < currOwnershipTimes.length; j++) {
            currOwnershipTimes[j].start += 0n; //TODO: ownershipTimes increment
            currOwnershipTimes[j].end += 0n;
          }
        }
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
          toAddressesLength: numRecipients,
          incrementBadgeIdsBy: numPerAddress,
          from: sender,
          precalculationDetails: {
            approvalId: approvalId.current,
            approvalLevel: "collection",
            approverAddress: ""
          },
          merkleProofs: [],
          memo: "",
        });
      }
    }

    setTransfersToAdd(newTransfersToAdd);
  }, [balances, numRecipients, increment, amountSelectType, toAddresses, doNotUseTransferWithIncrements, approvalId]);

  const uintRangesOverlap = checkIfUintRangesOverlap(balances[0]?.badgeIds || []);
  const uintRangesLengthEqualsZero = balances[0]?.badgeIds.length === 0;

  //We have five potential steps
  //1. Select recipients, number of codes, max number of claims depending on distribution method
  //2. Select badges to distribute
  //3. Select amount to distribute
  //4. Select time range (if claim)
  //5. Review and confirm
  const steps: StepProps[] = [];

  //Add first step (calculating number of recipients and who the recipients are in the case of a typical transfer)
  if (distributionMethod === DistributionMethod.Codes) {
    steps.push(ClaimCodesSelectStep(distributionMethod, setNumRecipients, claimPassword, setClaimPassword));
  } else if (distributionMethod === DistributionMethod.FirstComeFirstServe) {
    steps.push(ClaimCodesSelectStep(distributionMethod, setNumRecipients));
  } else {
    steps.push(RecipientsSelectStep({
      sender: sender,
      // collectionId: collectionId,
      // senderBalance: originalSenderBalances,
      setNumRecipients,
      toAddresses: toAddresses,
      setToAddresses: setToAddresses,
    }));
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
                  {increment ? `The first recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start}${increment > 1 ? `-${start + increment - 1n}` : ''}`).join(', ')}.` : ''}
                </div>
                <div style={{ marginLeft: 8 }}>

                  {increment ? `The second recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start + increment}${increment > 1 ? `-${start + increment + increment - 1n}` : ''}`).join(', ')}.` : ''}

                </div>

                {numRecipients > 3 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `...` : ''}
                  </div>
                </div>}
                {numRecipients > 2 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `The ${numRecipients === 3n ? 'third' : numRecipients + 'th'} selected recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances.map(x => x.badgeIds).flat().map(({ start }) => `${start + (numRecipients - 1n) * increment}${increment > 1 ? `-${start + (numRecipients - 1n) * increment + increment - 1n}` : ''}`).join(', ')}.` : ''}
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
      {<div>
        <BalancesInput
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
        <Divider />

        {
          postTransferBalances && <div>
            <BalanceBeforeAndAfter collectionId={collectionId} balances={preTransferBalances ? preTransferBalances : originalSenderBalances} newBalances={postTransferBalances} partyString='' beforeMessage='Before Transfer Is Added' afterMessage='After Transfer Is Added' />
            {/* {transfers.length >= 1 && <p style={{ textAlign: 'center' }} className='secondary-text'>*These balances assum.</p>} */}
          </div>
        }
      </div>}
    </div >,
    disabled: balances.length == 0 ||
      (!!postTransferBalances?.find((balance) => balance.amount < 0)) ||
      errorMessage ? true : false,
  });

  //Add time select step
  if (isClaimSelect) {
    if (distributionMethod === DistributionMethod.FirstComeFirstServe || (distributionMethod === DistributionMethod.Codes && claimPassword)) {
      steps.push(ClaimNumPerAddressSelectStep(numClaimsPerAddress, setNumClaimsPerAddress, distributionMethod, false));
    }
    steps.push(ClaimTimeRangeSelectStep(claimTimeRange, setClaimTimeRange));

    //We can eventually support this but currently, we store name/description tied to the merkleChallenge so first come first serve doesn't have a merkleChallenge and won't work
    if (distributionMethod !== DistributionMethod.FirstComeFirstServe) {
      steps.push(ClaimMetadataSelectSelectStep(claimDetails, setClaimDetails));
    }
  }

  steps.push({
    title: 'Confirm',
    description: <div className='flex-center flex-column'>
      {isClaimSelect ? <div>
        <ClaimDisplay
          approvedTransfer={approvedTransferToAdd}
          collectionId={collectionId}
        />
      </div> :
        <TransferDisplay
          transfers={transfersToAdd}
          collectionId={collectionId}
        />
      }
      <br />
      <Button type='primary'
        className='full-width'
        onClick={async () => {
          if (isTransferSelect && setTransfers && transfers) {
            setTransfers([...transfers, ...transfersToAdd]);
            setBalances([]);
            // setBalances([]);
          } else if (isClaimSelect && setApprovedTransfersToAdd && approvedTransfersToAdd) {
            // const convertedTransfers: TransferWithIncrements<bigint>[] = [...approvedTransfersToAdd, approvedTransferToAdd].map(approvedTransfer => {

            //   return {
            //     toAddresses: [],
            //     toAddressesLength: 1n,
            //     balances: approvedTransfer.balances,
            //     from: sender,
            //     precalculationDetails: {
            //       approvalId: approvalId.current,
            //       approvalLevel: "collection",
            //       approverAddress: ""
            //     },
            //     merkleProofs: [],
            //     memo: "",
            //   }
            // })
            // console.log("Setting claim balances");
            setBalances([]);

            //Previously we just set challenges and challengeDetails to []
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

              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].root = codesRoot ? codesRoot : '';
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].expectedProofLength = BigInt(codesTree.getLayerCount() - 1);
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].useCreatorAddressAsLeaf = false;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].maxOneUsePerLeaf = true;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details = claimDetails;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.leavesDetails.leaves = hashedCodes;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.leavesDetails.isHashed = true;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.leavesDetails.preimages = codes;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.numLeaves = BigInt(numRecipients);
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.password = claimPassword;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.hasPassword = claimPassword ? true : false;
            } else if (distributionMethod === DistributionMethod.Whitelist) {
              const accountsFetched = await accounts.fetchAccounts(toAddresses);
              for (let i = 0; i < toAddresses.length; i++) {
                addresses.push(accountsFetched[i].cosmosAddress);
              }

              const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
              const addressesRoot = addressesTree.getRoot().toString('hex');


              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].root = addressesRoot ? addressesRoot : '';
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].expectedProofLength = BigInt(addressesTree.getLayerCount() - 1);
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].useCreatorAddressAsLeaf = true;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].maxOneUsePerLeaf = false;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details = claimDetails;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.leavesDetails.leaves = addresses
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.leavesDetails.isHashed = false;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.numLeaves = BigInt(numRecipients);
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.password = ''
              approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.challengeDetails.hasPassword = false;
            } else {
              // approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details = claimDetails;
              // approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.password = ''
              // approvedTransferToAdd.approvalDetails[0].merkleChallenges[0].details.hasPassword = false;
              approvedTransferToAdd.approvalDetails[0].merkleChallenges = [];
            }

            setApprovedTransfersToAdd([...approvedTransfersToAdd, approvedTransferToAdd]);
          }
          setNumRecipients(0n);
          setToAddresses([]);
          setAmountSelectType(AmountSelectType.None);
          setIncrement(0n);
          setAddTransferIsVisible(false);
          setCurrentStep(0);

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
      <Row style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <Col md={11} sm={24} xs={24} className='flex'>
          <InformationDisplayCard
            title='Undistributed Badges'
            noBorder
          >
            {preTransferBalances && preTransferBalances.length > 0 && <BalanceDisplay
              collectionId={collectionId ?? MSG_PREVIEW_ID}
              balances={preTransferBalances}
            />}
            {(!preTransferBalances || preTransferBalances.length === 0) && <Empty
              className='primary-text'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No badges left to distribute.'
            />}
          </InformationDisplayCard>
        </Col>

        <Col md={11} sm={24} xs={24} className='flex'>
          <InformationDisplayCard
            title={<>Added - {distributionMethod}</>}
            noBorder
          >
            <>
              {[...(transfers ?? []), ...(approvedTransfersToAdd ?? [])].length === 0 && <Empty
                className='primary-text'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={distributionMethod === DistributionMethod.Codes ? 'No codes generated.' : distributionMethod === DistributionMethod.Whitelist ? 'No users added.' : 'No claims added.'} />}

              {[...(transfers ?? []), ...(approvedTransfersToAdd ?? [])].length > 0 && <>
                {distributionMethod === DistributionMethod.Codes && <>
                  <Typography.Text className='primary-text'>
                    Once the badge(s) have been created, navigate to the Claims tab to distribute these codes.
                  </Typography.Text>
                  <br />
                  <br />
                </>}
                <div className='flex-center'>
                  <Pagination currPage={currPage} onChange={setCurrPage} total={[...(transfers ?? []), ...(approvedTransfersToAdd ?? [])].length} pageSize={1} />
                </div>
                <Collapse accordion className='primary-text primary-blue-bg' style={{ margin: 0 }}>
                  {[...(transfers ?? []), ...(approvedTransfersToAdd ?? [])].map((item, index) => {
                    if (index < (currPage - 1) * (distributionMethod === DistributionMethod.Codes ? 20 : 10) || index >= currPage * (distributionMethod === DistributionMethod.Codes ? 20 : 10)) {
                      return <></>
                    }

                    // const transferItem = item as TransferWithIncrements<bigint>;
                    const transfer = item as (CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] });
                    const claimItem = transfer.approvalDetails && transfer.approvalDetails.length > 0 && transfer.approvalDetails[0].merkleChallenges.length > 0 ? transfer.approvalDetails[0].merkleChallenges[0].details : undefined;
                    return <CollapsePanel
                      header={
                        <div className='primary-text' style={{ margin: 0, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                            <Text strong className='primary-text'>
                              {index + 1}) {distributionMethod} {distributionMethod === DistributionMethod.Codes ?
                                claimItem?.password ? '(Claim Password: ' + claimItem.password + ')' : claimItem?.challengeDetails?.leavesDetails.preimages?.length + ' Codes'
                                : ''} {distributionMethod === DistributionMethod.Whitelist ? '(Addresses: ' + claimItem?.challengeDetails?.numLeaves + ')' : ''}
                            </Text>
                          </div>

                          <div>
                            <Tooltip title='Delete'>
                              <DeleteOutlined onClick={
                                () => {
                                  if (isClaimSelect && setApprovedTransfersToAdd && approvedTransfersToAdd) setApprovedTransfersToAdd(approvedTransfersToAdd.filter((_, i) => i !== index));
                                  if (isTransferSelect && setTransfers && transfers) setTransfers(transfers.filter((_, i) => i !== index));
                                }
                              } />
                            </Tooltip>
                          </div>
                        </div>
                      }
                      key={index}
                      className='primary-text primary-blue-bg'
                    >
                      <div className='flex-center flex-column'>x
                        {isClaimSelect && <div className='primary-text primary-blue-bg' >
                          <ClaimDisplay
                            approvedTransfer={transfer}
                            collectionId={collectionId}
                          />
                          <Divider />
                        </div>}
                        {isTransferSelect && <div className='primary-text primary-blue-bg' >
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
      </Row>

    </div >
    <br />
    <div style={{ alignItems: 'center' }} className='primary-text full-width'>
      {
        !addTransferIsVisible && !hideTransferDisplay && <div>
          {!isClaimSelect && <div>
            <div className='flex-between'>
              <div></div>
              <h2 style={{ textAlign: 'center' }} className='primary-text'>Transfers Added ({convertedTransfers.length})</h2>
              <div></div>
            </div>
            <TransferDisplay
              transfers={convertedTransfers}
              setTransfers={setTransfers}
              collectionId={collectionId}
              deletable
            />
          </div>}

          {isClaimSelect && numActiveClaims > 0 && <div>
            <div className='flex-between'>
              <div></div>
              <h2 style={{ textAlign: 'center' }} className='primary-text'>Claims Added ({approvedTransfersToAdd?.length})</h2>
              <div></div>
            </div>
            <ClaimsTab
              collectionId={collectionId}
            // codesAndPasswords={}
            // codes={approvedTransfersToAdd.map(x => x.codes)}
            // passwords={approvedTransfersToAdd.map(x => x.password)}
            />
          </div>
          }

          <Divider />
          <br />
        </div>
      }

      {
        addTransferIsVisible ?
          <div className='full-width'>
            <div className='flex-between' >
              <div></div>
              <div>
                <Tooltip title='Cancel' placement='bottom'>
                  <CloseOutlined
                    onClick={() => {
                      setAddTransferIsVisible(false);
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
                className='screen-button'
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