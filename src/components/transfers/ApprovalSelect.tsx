import { FormOutlined, InfoCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Col, Input, Row, Switch, Tooltip, Typography, notification } from 'antd';
import { AddressList, ApprovalAmounts, Balance, MustOwnBadges, deepCopy } from 'bitbadgesjs-sdk';
import { ApprovalCriteriaWithDetails, ApprovalInfoDetails, CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, DistributionMethod, MerkleChallengeWithDetails, Numberify, checkIfUintRangesOverlap, convertToCosmosAddress, getAllBadgeIdsToBeTransferred, getReservedAddressList, isAddressListEmpty, isFullUintRanges, isInAddressList, validateCollectionApprovalsUpdate } from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BalanceInput } from '../balances/BalanceInput';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BadgeIDSelectWithSwitch } from '../inputs/BadgeIdRangesInput';
import { DateRangeInput } from '../inputs/DateRangeInput';
import { NumberInput } from '../inputs/NumberInput';
import { RadioGroup } from '../inputs/Selects';
import { AddressListSelectComponent } from './ApprovalSelectHelpers/AddressListsSelectComponent';
import { ApprovalAmounts as ApprovalAmountsComponent } from './ApprovalSelectHelpers/ApprovalAmountsSelectComponent';
import { MaxUses } from './ApprovalSelectHelpers/MaxUsesSelectComponent';
import { OrderCalculationMethod } from './ApprovalSelectHelpers/OrderCalculationComponent';
import { ClaimMetadataSelect } from './ClaimMetadataSelectStep';

const crypto = require('crypto');

export enum CodeType {
  None,
  Unique,
  Reusable
}

export enum AmountType {
  Tally,
  Predetermined,
}

export enum PredeterminedType {
  Dynamic,
  Same,
  NoLimit
}

export type RequiredApprovalProps = CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>>, details: ApprovalInfoDetails<bigint> };

//Get minimum value but ignore 0 values 
const minNonZeroValue = (values: bigint[]) => {
  let min = GO_MAX_UINT_64;
  for (const value of values) {
    if (value > 0n && value < min) {
      min = value;
    }
  }
  return min;
}




//Gets the max increments applied to the approval
//Basicallly, it is the minimum value set for overall max uses and the selected usePer max uses (where applicable)
export const getMaxIncrementsApplied = (
  approvalToAdd: RequiredApprovalProps,
) => {
  const checkedKeyId = Object.entries(approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).find(([, val]) => val === true)?.[0];
  let maxIncrementsApplied = 0n;
  if (checkedKeyId === 'useOverallNumTransfers' || checkedKeyId === 'useMerkleChallengeLeafIndex' || !checkedKeyId) {
    maxIncrementsApplied = approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
  } else if (checkedKeyId === 'usePerFromAddressNumTransfers') {
    maxIncrementsApplied = minNonZeroValue([approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers, approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers]);
  } else if (checkedKeyId === 'usePerInitiatedByAddressNumTransfers') {
    maxIncrementsApplied = minNonZeroValue([approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers, approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers]);
  } else if (checkedKeyId === 'usePerToAddressNumTransfers') {
    maxIncrementsApplied = minNonZeroValue([approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers, approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers]);
  }

  return maxIncrementsApplied;
}

export const getAllApprovedBadges = (
  approvalToAdd: RequiredApprovalProps,
  amountType: AmountType,
  startBalances: Balance<bigint>[],
  increment: bigint,
) => {
  if (amountType === AmountType.Tally) {
    return approvalToAdd.badgeIds
  } else {
    const maxIncrementsApplied = getMaxIncrementsApplied(approvalToAdd);
    const allApprovedBadges = getAllBadgeIdsToBeTransferred([
      {
        from: '',
        balances: startBalances.map(x => { return { ...x, amount: 1n } }),
        toAddressesLength: maxIncrementsApplied,
        toAddresses: [],
        incrementBadgeIdsBy: increment > 0 ? increment : 0n,
        incrementOwnershipTimesBy: 0n,
      }
    ]);
    console.log("APPROVVED", approvalToAdd.badgeIds, allApprovedBadges)
    return allApprovedBadges;
  }
}




export function ApprovalSelect({
  collectionId,
  setVisible,
  distributionMethod,
  setDistributionMethod,
  defaultFromList,
  fromListLocked,
  defaultApproval,
  showMintingOnlyFeatures,
  defaultToList,
  defaultInitiatedByList,
  toListLocked,
  initiatedByListLocked,
  approvalsToAdd,
  setApprovalsToAdd,
  hideCollectionOnlyFeatures,
  startingApprovals,
  approvalPermissions
}: {
  fromListLocked?: boolean;
  defaultFromList?: AddressList,
  defaultToList?: AddressList,
  defaultInitiatedByList?: AddressList,
  toListLocked?: boolean;
  initiatedByListLocked?: boolean;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  setDistributionMethod: (distributionMethod: DistributionMethod) => void;
  hideRemaining?: boolean;
  setVisible?: (visible: boolean) => void;
  defaultApproval?: CollectionApprovalWithDetails<bigint>
  showMintingOnlyFeatures?: boolean;
  approvalsToAdd: CollectionApprovalWithDetails<bigint>[];
  setApprovalsToAdd: (approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => void;
  hideCollectionOnlyFeatures?: boolean;
  startingApprovals: CollectionApprovalWithDetails<bigint>[];
  approvalPermissions: CollectionApprovalPermissionWithDetails<bigint>[]
}) {
  const isEdit = !!defaultApproval
  const nonMintOnlyApproval = defaultFromList?.listId === '!Mint';
  const mintOnlyApproval = defaultFromList?.listId === 'Mint' && fromListLocked;

  const chain = useChainContext();
  const collection = useCollection(collectionId);
  const [showMustOwnBadges, setShowMustOwnBadges] = useState(false);
  const [codeType, setCodeType] = useState(CodeType.None);
  const [claimPassword, setClaimPassword] = useState('');
  const [predeterminedType, setPredeterminedType] = useState(PredeterminedType.NoLimit);

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));

  const defaultApprovalToAdd: CollectionApprovalWithDetails<bigint> & {
    approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>>
    details: ApprovalInfoDetails<bigint>
  } = {
    fromListId: defaultFromList ? defaultFromList.listId : 'Mint',
    fromList: defaultFromList ? defaultFromList : getReservedAddressList("Mint"),
    toListId: defaultToList ? defaultToList.listId : 'All',
    toList: defaultToList ? defaultToList : getReservedAddressList("All"),
    initiatedByListId: defaultInitiatedByList ? defaultInitiatedByList.listId : 'All',
    initiatedByList: defaultInitiatedByList ? defaultInitiatedByList : getReservedAddressList("All"),
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: [],
    approvalId: '',
    amountTrackerId: '',
    challengeTrackerId: '',

    ...defaultApproval,

    details: {
      name: '',
      description: '',
      hasPassword: false,
      challengeDetails: {
        leavesDetails: {
          leaves: [],
          isHashed: false,
        },
      },
      ...defaultApproval?.details,
    },
    approvalCriteria: {

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
        perInitiatedByAddressMaxNumTransfers: 0n,
      },
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [],
          incrementBadgeIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
        },
        orderCalculationMethod: {
          useMerkleChallengeLeafIndex: false,
          useOverallNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          usePerToAddressNumTransfers: false,
        },
      },
      merkleChallenge: {
        root: '',
        expectedProofLength: 0n,

        useCreatorAddressAsLeaf: false,
        maxUsesPerLeaf: 1n,
        uri: '',
        customData: '',
      }, //handled later
      requireToEqualsInitiatedBy: false,
      requireFromEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,

      overridesToIncomingApprovals: false,
      overridesFromOutgoingApprovals: defaultFromList?.listId === 'Mint' ? true : false,

      ...defaultApproval?.approvalCriteria,
    },
  }


  const [approvalToAdd, setApprovalToAdd] = useState<CollectionApprovalWithDetails<bigint> & {
    approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>>,
    details: ApprovalInfoDetails<bigint>
  }>(deepCopy(defaultApprovalToAdd));

  const numRecipients = approvalToAdd?.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers || 0n;

  const mustOwnBadges = approvalToAdd?.approvalCriteria?.mustOwnBadges || [];
  const setMustOwnBadges = (mustOwnBadges: MustOwnBadges<bigint>[]) => { setApprovalToAdd({ ...approvalToAdd, approvalCriteria: { ...approvalToAdd.approvalCriteria, mustOwnBadges } }) };

  const requireToEqualsInitiatedBy = approvalToAdd?.approvalCriteria?.requireToEqualsInitiatedBy || false;
  const requireToDoesNotEqualInitiatedBy = approvalToAdd?.approvalCriteria?.requireToDoesNotEqualInitiatedBy || false;
  const requireFromEqualsInitiatedBy = approvalToAdd?.approvalCriteria?.requireFromEqualsInitiatedBy || false;
  const requireFromDoesNotEqualInitiatedBy = approvalToAdd?.approvalCriteria?.requireFromDoesNotEqualInitiatedBy || false;
  const increment = approvalToAdd?.approvalCriteria?.predeterminedBalances?.incrementedBalances?.incrementBadgeIdsBy || 0n;
  const startBalances = approvalToAdd?.approvalCriteria.predeterminedBalances?.incrementedBalances?.startBalances || [];

  const uintRangesOverlap = checkIfUintRangesOverlap(approvalToAdd?.badgeIds || []);
  const uintRangesLengthEqualsZero = approvalToAdd?.badgeIds.length === 0;

  const ownedTimesOverlap = checkIfUintRangesOverlap(approvalToAdd?.ownershipTimes || []);
  const ownedTimesLengthEqualsZero = approvalToAdd?.ownershipTimes.length === 0;

  const transferTimesOverlap = checkIfUintRangesOverlap(approvalToAdd?.transferTimes || []);
  const transferTimesLengthEqualsZero = approvalToAdd?.transferTimes.length === 0;

  const [amountType, setAmountType] = useState<AmountType>(AmountType.Tally);
  const [expectedPartitions, setExpectedPartitions] = useState<bigint>(1n);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('amountType', amountType);
    const newPredeterminedBalances: Balance<bigint>[] = [];
    let newApprovalAmounts: ApprovalAmounts<bigint> | undefined = undefined

    if (amountType === AmountType.Predetermined) {
      newPredeterminedBalances.push({
        amount: 1n,
        badgeIds: deepCopy(approvalToAdd.badgeIds),
        ownershipTimes: deepCopy(approvalToAdd.ownershipTimes),
      });
      newApprovalAmounts = {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
      }
    }

    setApprovalToAdd((approvalToAdd) => {
      return {
        ...approvalToAdd,

        approvalCriteria: {
          ...approvalToAdd.approvalCriteria,
          approvalAmounts: {
            ...approvalToAdd.approvalCriteria.approvalAmounts,
            ...newApprovalAmounts,
          },
          predeterminedBalances: {
            ...approvalToAdd.approvalCriteria.predeterminedBalances,
            manualBalances: [],
            incrementedBalances: {
              ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
              startBalances: newPredeterminedBalances,
              incrementBadgeIdsBy: amountType === AmountType.Predetermined ? 1n : 0n,
              incrementOwnershipTimesBy: 0n,

            },
            orderCalculationMethod: {
              ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
              useOverallNumTransfers: false,
              usePerFromAddressNumTransfers: false,
              usePerInitiatedByAddressNumTransfers: false,
              usePerToAddressNumTransfers: false,
              useMerkleChallengeLeafIndex: false,
            },
          }
        }
      }
    });
  }, [amountType, approvalToAdd.badgeIds, approvalToAdd.ownershipTimes]);

  const PasswordSelect = <div style={{ textAlign: 'center' }}>

    <br />
    <b style={{ textAlign: 'center' }}>Password</b>
    <Input
      value={claimPassword}
      onChange={(e) => {
        setClaimPassword?.(e.target.value);
      }}
      className='primary-text inherit-bg'
      style={{ textAlign: 'center' }}
    />
    {!claimPassword && <div style={{ color: 'red' }}>Password cannot be empty.</div>}
  </div>

  const str = codeType == CodeType.Unique ? "Codes will be uniquely generated and one-time use only. Users can enter an unused code to claim badges." :
    "A custom password can be used to claim badges (e.g. attendance code = password123). Limited to one use per address."

  const LearnMore = <div style={{ textAlign: 'center' }} className='secondary-text'>
    <br />
    <p>
      <InfoCircleOutlined /> {str} This is a centralized solution. <Tooltip color='black' title="For a better user experience, codes and passwords are stored in a centralized manner via the BitBadges servers. This makes it easier for you (the collection creator) by eliminating storage requirements. For a decentralized solution, you can store your own codes and interact directly with the blockchain (see documentation).">
        Hover to learn more.
      </Tooltip>
    </p>
  </div>

  const getCurrentManagerApprovals = () => {
    const approvals: RequiredApprovalProps[] = [];

    if (!collection) return approvals;

    for (const managerTimelineVal of collection.managerTimeline) {
      const times = managerTimelineVal.timelineTimes;
      const manager = managerTimelineVal.manager;

      if (!manager) continue;
      const id = crypto.randomBytes(32).toString('hex');

      approvals.push({
        ...defaultApprovalToAdd,
        toList: getReservedAddressList("All"),
        toListId: "All",
        fromListId: "Mint",
        fromList: getReservedAddressList("Mint"),
        initiatedByList: getReservedAddressList(convertToCosmosAddress(manager)),
        initiatedByListId: convertToCosmosAddress(manager),
        transferTimes: times,
        badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
        ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        approvalId: id,
        amountTrackerId: id,
        challengeTrackerId: id,
        approvalCriteria: {
          ...defaultApprovalToAdd.approvalCriteria,
          overridesFromOutgoingApprovals: true,
          overridesToIncomingApprovals: true,
        }
      })
    }

    return approvals;
  }

  const currDate = useMemo(() => {
    const date = new Date();
    return date;
  }, []);

  const currDatePlus24Hours = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date;
  }, []);


  const approveSelfFor24Hours = () => {
    return {
      ...defaultApprovalToAdd,
      toList: getReservedAddressList("All"),
      toListId: "All",
      fromListId: "Mint",
      fromList: getReservedAddressList("Mint"),
      initiatedByList: getReservedAddressList(chain.cosmosAddress),
      initiatedByListId: chain.cosmosAddress,
      transferTimes: [{ start: BigInt(currDate.getTime()), end: BigInt(currDatePlus24Hours.getTime()) }],
      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      approvalId: "approve-self-24-hours",
      amountTrackerId: "approve-self-24-hours",
      challengeTrackerId: "approve-self-24-hours",
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
      }
    }
  }

  const AllMaxUses = <>
    <div className='full-width'>
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses (all cumulatively)'} type='overall' disabled={distributionMethod === DistributionMethod.Codes} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses per initiator'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
        label={'Max uses per sender'} type='from' />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
        label={'Max uses per recipient'} type='to' />
    </div>
  </>

  return <>
    <Typography.Text style={{ textAlign: 'center' }} className="secondary-text">
      <WarningOutlined style={{ marginRight: 5, color: '#FF5733' }} />
      Below, you are creating an approval.
      Approvals determine the rules for how badges can be transferred but do not actually transfer the badges.
      For any transfer to be successful, there must be a valid approval and sufficient balances.
    </Typography.Text>
    <br /><br />
    {mintOnlyApproval && <div style={{ textAlign: 'center' }} className="">
      <b>Apply a template?</b>{' '}
      <div className='flex-center secondary-text flex-wrap'>
        <Tooltip color='black' title='Approve yourself for 24 hours to transfer with no restrictions from the Mint address.'>
          <button
            className='cursor-pointer hoverable styled-button-normal rounded p-2 m-2 '
            style={{ borderWidth: 1 }}
            onClick={() => {
              if (!collection) return;

              setApprovalToAdd(approveSelfFor24Hours());

              notification.success({
                message: 'Template applied',
              });
            }}
          >
            <FormOutlined /> Approve self for 24 hours
          </button>
        </Tooltip>
        {getCurrentManagerApprovals().length == 1 &&
          <Tooltip color='black'
            title='Using the selected values for the manager, this will create an approval that approves the manager at any given time to transfer from the Mint address with no restrictions.'>

            <button
              className='cursor-pointer hoverable styled-button-normal rounded p-2 m-2'
              style={{ borderWidth: 1 }}
              onClick={() => {
                if (!collection) return;

                setApprovalToAdd(getCurrentManagerApprovals()[0]);

                notification.success({
                  message: 'Template applied',
                });
              }}
            >
              <FormOutlined />  Approve current manager at any given time
            </button>
          </Tooltip>}
      </div>
      <br />
    </div>}



    <Row style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='primary-text'>

      <div className='flex flex-wrap full-width'>
        <InformationDisplayCard title={<>From <LockOutlined /></>} md={8} xs={24} sm={24} subtitle='Who can send the badges?'>
          <AddressListSelectComponent
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} nonMintOnlyApproval={nonMintOnlyApproval}
            type='from' disabled={fromListLocked} />

          {!hideCollectionOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Do not check outgoing approvals?'} value={<Switch
            disabled={fromListLocked}
            checked={approvalToAdd.approvalCriteria.overridesFromOutgoingApprovals}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  overridesFromOutgoingApprovals: checked,
                }
              });
            }}
          />} />}
          <TableRow labelSpan={16} valueSpan={8} label={'Sender must be approver?'} value={<Switch
            checked={requireFromEqualsInitiatedBy}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  requireFromEqualsInitiatedBy: checked,
                }
              });
            }}
            disabled={fromListLocked}
          />} />
          <TableRow labelSpan={16} valueSpan={8} label={'Sender must not be approver?'} value={<Switch
            checked={requireFromDoesNotEqualInitiatedBy}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  requireFromDoesNotEqualInitiatedBy: checked,
                }
              });
            }}
            disabled={fromListLocked}
          />} />

          {requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy && <div style={{ color: 'red' }}>Sender cannot be both approver and not approver.</div>}


        </InformationDisplayCard>
        <InformationDisplayCard title='To' md={8} xs={24} sm={24} subtitle='Who can receive the badges?'>
          <AddressListSelectComponent
            disabled={toListLocked}
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
            type='to' />
          {!hideCollectionOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Do not check incoming approvals?'} value={<Switch
            disabled={toListLocked}
            checked={approvalToAdd.approvalCriteria.overridesToIncomingApprovals}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  overridesToIncomingApprovals: checked,
                }
              });
            }}
          />} />}
          <TableRow labelSpan={16} valueSpan={8} label={'Recipient must be approver?'} value={<Switch
            disabled={toListLocked}
            checked={requireToEqualsInitiatedBy}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  requireToEqualsInitiatedBy: checked,
                }
              });
            }}
          />} />
          <TableRow labelSpan={16} valueSpan={8} label={'Recipient must not be approver?'} value={<Switch
            disabled={toListLocked}
            checked={requireToDoesNotEqualInitiatedBy}
            onChange={(checked) => {
              setApprovalToAdd({
                ...approvalToAdd,
                approvalCriteria: {
                  ...approvalToAdd.approvalCriteria,
                  requireToDoesNotEqualInitiatedBy: checked,
                }
              });
            }}
          />} />
          {requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy && <div style={{ color: 'red' }}>Recipient cannot be both approver and not approver.</div>}
          {requireFromEqualsInitiatedBy && requireToEqualsInitiatedBy && <div style={{ color: 'red' }}>Recipient cannot be sender, recipient, and approver.</div>}
        </InformationDisplayCard>
        <InformationDisplayCard title='Approved' md={8} xs={24} sm={24} subtitle='Who is approved to initiate the transfer?'>
          {/* Choose between codes, whitelist, and password */}
          {showMintingOnlyFeatures && !initiatedByListLocked &&
            <RadioGroup
              value={distributionMethod == DistributionMethod.None ? 'address' :
                distributionMethod == DistributionMethod.Codes ? codeType == CodeType.Unique ? 'codes' : 'password' : 'address'}
              onChange={(e) => {


                if (e === 'password') {
                  setCodeType(CodeType.Reusable);
                  setDistributionMethod(DistributionMethod.Codes);
                  setAmountType(AmountType.Tally);
                  setPredeterminedType(PredeterminedType.Same);
                  setExpectedPartitions(1n);
                  setApprovalToAdd({
                    ...approvalToAdd,
                    initiatedByList: getReservedAddressList("All"),
                    initiatedByListId: "All",
                    approvalCriteria: {
                      ...approvalToAdd.approvalCriteria,
                      maxNumTransfers: {
                        ...approvalToAdd.approvalCriteria.maxNumTransfers,
                        overallMaxNumTransfers: 1n,
                        perInitiatedByAddressMaxNumTransfers: 1n,
                      }
                    }
                  });
                } else if (e === 'codes') {
                  setCodeType(CodeType.Unique);
                  setDistributionMethod(DistributionMethod.Codes);
                  setExpectedPartitions(1n);
                  setAmountType(AmountType.Tally);
                  setPredeterminedType(PredeterminedType.Same);
                  setApprovalToAdd({
                    ...approvalToAdd,
                    initiatedByList: getReservedAddressList("All"),
                    initiatedByListId: "All",
                    approvalCriteria: {
                      ...approvalToAdd.approvalCriteria,
                      maxNumTransfers: {
                        ...approvalToAdd.approvalCriteria.maxNumTransfers,
                        overallMaxNumTransfers: 1n,
                        perInitiatedByAddressMaxNumTransfers: 1n,
                      }
                    }
                  });
                } else {
                  setDistributionMethod(DistributionMethod.None);
                }
                setClaimPassword('');
              }}
              options={[
                {
                  label: 'By Address',
                  value: 'address',
                },
                {
                  label: 'Codes',
                  value: 'codes',
                },
                {
                  label: 'Password',
                  value: 'password'
                },
              ]}
            />}


          {(distributionMethod === DistributionMethod.None || distributionMethod === DistributionMethod.Whitelist) &&
            <AddressListSelectComponent
              disabled={initiatedByListLocked}
              approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
              type='initiatedBy' />}



          {approvalToAdd.initiatedByList.whitelist && showMintingOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Store whitelist off-chain?'} value={
            <Switch
              disabled={initiatedByListLocked || distributionMethod === DistributionMethod.Codes}
              checked={distributionMethod === DistributionMethod.Whitelist} onChange={(checked) => {
                if (checked) {
                  setDistributionMethod(DistributionMethod.Whitelist);
                } else {
                  setDistributionMethod(DistributionMethod.None);
                }
              }} />
          } />}


          {distributionMethod === DistributionMethod.Codes && codeType == CodeType.Unique && <>
            {distributionMethod === DistributionMethod.Codes && LearnMore}
            {codeType == CodeType.Unique && <>
              <div className='flex-center flex-wrap flex-column'>
                <MaxUses
                  setExpectedPartitions={setExpectedPartitions}
                  isCodeDisplay approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={initiatedByListLocked} />

              </div>
            </>}
          </>}

          {distributionMethod === DistributionMethod.Codes && codeType == CodeType.Reusable && <>
            {distributionMethod === DistributionMethod.Codes && LearnMore}

            {codeType == CodeType.Reusable &&
              <>
                {PasswordSelect}
                <br />
                <MaxUses isPasswordDisplay
                  setExpectedPartitions={setExpectedPartitions}
                  approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={initiatedByListLocked} />
              </>}


          </>}
          <TableRow labelSpan={16} valueSpan={8} label={<>Must own specific badges?</>}
            value={<>
              <Switch
                checked={mustOwnBadges.length > 0 || showMustOwnBadges}
                onChange={(checked) => {
                  setMustOwnBadges([]);
                  setShowMustOwnBadges(checked);
                }}
              />
            </>
            } />
          {showMustOwnBadges &&
            <InformationDisplayCard
              title={''}
              subtitle={'Select badges that the approver must own (or not own) at the time of transfer. Only works for badges with on-chain balances.'}
              span={24}
              noPadding
              inheritBg
              noBorder
            >
              <div className='primary-text'>
                <br />

                <BalanceInput
                  fullWidthCards
                  isMustOwnBadgesInput
                  noOffChainBalances
                  message="Must Own Badges"
                  balancesToShow={mustOwnBadges.map(x => {
                    return {
                      ...x,
                      amount: x.amountRange.start,
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    }
                  })}
                  mustOwnBadges={mustOwnBadges}
                  onAddBadges={(balance, amountRange, collectionId, mustSatisfyForAllAssets, overrideWithCurrentTime) => {
                    if (!collectionId || !amountRange) return;

                    setMustOwnBadges([...mustOwnBadges, {
                      collectionId: collectionId,
                      overrideWithCurrentTime: !!overrideWithCurrentTime,
                      amountRange: amountRange,
                      badgeIds: balance.badgeIds,
                      ownershipTimes: balance.ownershipTimes,
                      mustSatisfyForAllAssets: !!mustSatisfyForAllAssets
                    }]);
                  }}
                  onRemoveAll={() => {
                    setMustOwnBadges([]);
                  }}
                  // setBalances={setBalances}
                  collectionId={collectionId}
                />
              </div>
            </InformationDisplayCard>}

        </InformationDisplayCard>
      </div>



      <div className='flex flex-wrap full-width'>
        <InformationDisplayCard title='Badge IDs' md={8} xs={24} sm={24} subtitle='Which badges are approved to be transferred?'>

          {showMintingOnlyFeatures && <><br />
            <RadioGroup value={amountType} onChange={(e) => {
              setAmountType(e);
              setPredeterminedType(e === AmountType.Predetermined ? PredeterminedType.Dynamic : PredeterminedType.Same);
              if (e === AmountType.Predetermined && isFullUintRanges(approvalToAdd.badgeIds)) {
                setApprovalToAdd({
                  ...approvalToAdd,
                  badgeIds: [],
                });
              }
            }} options={[
              { label: <>Standard {distributionMethod === DistributionMethod.Codes ? " - All or Nothing" : ""}</>, value: AmountType.Tally },
              { label: 'Partitions', value: AmountType.Predetermined },
            ]} />


            <div className='secondary-text' style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }}>
              {amountType === AmountType.Predetermined && <>
                <InfoCircleOutlined /> Partitions - Different uses of this approval can correspond to different badge IDs (e.g. use #1 can be for badge IDs 1-5, use #2 can be for badge IDs 6-10, etc.).
              </>}
              {amountType === AmountType.Tally && <>
                <InfoCircleOutlined /> Standard - All uses of this approval will be for the same badge IDs ({getBadgeIdsString(approvalToAdd.badgeIds)}).
              </>}
            </div>

            <br />
            {amountType === AmountType.Predetermined && <>

              <BadgeIDSelectWithSwitch
                message={"Select Badge IDs for Partition #1"}
                collectionId={collectionId}
                hideBadges
                disabled={amountType === AmountType.Predetermined}
                uintRanges={approvalToAdd?.badgeIds || []}
                setUintRanges={(uintRanges) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    badgeIds: uintRanges,
                  });
                }}
              />
              {approvalToAdd.badgeIds.length === 0 && <div style={{ color: 'red' }}>
                <WarningOutlined /> Badge IDs cannot be empty.
              </div>}
              {approvalToAdd.badgeIds.length > 0 && <>
                <div className='flex-center'>
                  <NumberInput

                    value={increment ? Numberify(increment.toString()) : 0}
                    setValue={(value) => {
                      setApprovalToAdd({
                        ...approvalToAdd,
                        approvalCriteria: {
                          ...approvalToAdd.approvalCriteria,
                          predeterminedBalances: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances,
                            incrementedBalances: {
                              ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                              incrementBadgeIdsBy: BigInt(value),
                            }
                          }
                        }
                      });
                    }}
                    min={1}
                    title="IDs Increment"
                  />

                  <NumberInput
                    disabled={distributionMethod === DistributionMethod.Codes}
                    value={expectedPartitions ? Numberify(expectedPartitions.toString()) : 0}
                    setValue={(value) => {
                      setExpectedPartitions(BigInt(value));
                    }}
                    min={1}
                    title="Partitions"
                  />

                </div>

                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div>
                    <div style={{ marginLeft: 8 }}>
                      {increment === 0n && 'Each use of this approval will transfer the following badges: '}
                      {increment ? `Partition #1 = ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat())}` : ''}
                    </div>

                    {expectedPartitions > 1n &&
                      <div style={{ marginLeft: 8 }}>

                        {increment ? `Partition #2 = ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment, end: x.end + increment } }))}` : ''}

                      </div>}

                    {expectedPartitions > 2n &&
                      <div style={{ marginLeft: 8 }}>
                        <div style={{ marginLeft: 8 }}>
                          ...
                        </div>
                        <div style={{ marginLeft: 8 }}>
                          {increment ? `Partition #${expectedPartitions} = ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment * (expectedPartitions - 1n), end: x.end + increment * (expectedPartitions - 1n) } }))}` : ''}
                        </div>
                      </div>}
                  </div>
                </div>
              </>}
              {distributionMethod === DistributionMethod.Codes && <div className='secondary-text' style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                <LockOutlined /> To edit number of partitions, edit the number of {distributionMethod === DistributionMethod.Codes &&
                  codeType === CodeType.Unique ? "codes" : "password uses"}.
              </div>}
              <br />

              <BadgeAvatarDisplay
                collectionId={collectionId}
                showIds
                badgeIds={getAllBadgeIdsToBeTransferred([
                  {
                    from: 'Mint',
                    toAddresses: [],
                    toAddressesLength: expectedPartitions,
                    incrementBadgeIdsBy: increment,
                    balances: startBalances.map(x => { return { ...x, amount: 1n } }),
                  }
                ])} />

            </>}
          </>}

          {amountType !== AmountType.Predetermined && <>
            <br />
            <BadgeIDSelectWithSwitch
              collectionId={collectionId}
              uintRanges={approvalToAdd?.badgeIds || []}
              setUintRanges={(uintRanges) => {
                setApprovalToAdd({
                  ...approvalToAdd,
                  badgeIds: uintRanges,
                });
              }}
            /></>}

        </InformationDisplayCard>

        <InformationDisplayCard md={8} xs={24} sm={24} title='Ownership Times' subtitle='Which ownership times for the badges are approved to be transferred?'>
          <br />
          <Switch
            checked={isFullUintRanges(approvalToAdd.ownershipTimes)}
            checkedChildren="All Times"
            unCheckedChildren="Custom"
            onChange={(checked) => {
              if (checked) {
                setApprovalToAdd({
                  ...approvalToAdd,
                  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                });
              } else {
                setApprovalToAdd({
                  ...approvalToAdd,
                  ownershipTimes: [],
                });
              }
            }}
          />
          <br />
          <br />

          <>
            {isFullUintRanges(approvalToAdd.ownershipTimes) ? <></> : <>
              {approvalToAdd.ownershipTimes.length == 0 && <div style={{ color: 'red' }}>
                <WarningOutlined /> Ownership times cannot be empty.
              </div>}
              <DateRangeInput
                timeRanges={approvalToAdd.ownershipTimes}
                setTimeRanges={(ownershipTimes) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    ownershipTimes,
                  });
                }}
              />
            </>
            }</>

        </InformationDisplayCard>
        <InformationDisplayCard md={8} xs={24} sm={24} title='Amounts' subtitle='Select the amounts to approve.'>
          <br />
          {(approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0) && <div style={{ color: 'red' }}>
            <WarningOutlined /> Badge IDs and / or ownership times cannot be empty.
          </div>}
          {approvalToAdd.badgeIds.length > 0 && approvalToAdd.ownershipTimes.length > 0 && <div className='flex-center'>

            <Col >

              {amountType === AmountType.Tally && <>

                {distributionMethod !== DistributionMethod.Codes && <>

                  <RadioGroup
                    value={predeterminedType !== PredeterminedType.Same ?
                      predeterminedType === PredeterminedType.NoLimit ? "none" :

                        "tally" : "all"}
                    onChange={(e) => {
                      if (e === "tally") {
                        setAmountType(AmountType.Tally);
                        setPredeterminedType(PredeterminedType.Dynamic);
                      }
                      if (e === "all") {
                        setAmountType(AmountType.Tally);
                        setPredeterminedType(PredeterminedType.Same);
                      }

                      if (e === "none") {
                        setAmountType(AmountType.Tally);
                        setPredeterminedType(PredeterminedType.NoLimit);
                      }

                    }
                    } options={[
                      { label: 'All or Nothing', value: "all" },
                      { label: 'Tally', value: "tally" },
                      { label: 'No Limit', value: "none" },
                    ]}
                  />
                </>
                }
                {predeterminedType !== PredeterminedType.Same && predeterminedType === PredeterminedType.NoLimit && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='secondary-text full-width'>
                    <div className=''>
                      <InfoCircleOutlined /> No Limit - No amount restrictions. Amounts will not be tracked. You can optionally choose to restrict the max number of uses, but each use will still approve an unlimited amount.
                    </div>
                  </div>
                  <br />
                  {AllMaxUses}
                </>}
                {predeterminedType !== PredeterminedType.Same && predeterminedType === PredeterminedType.Dynamic && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='secondary-text'>
                    <div className=''>
                      <InfoCircleOutlined /> Tally - Approvals will correspond to the selected badge IDs ({getBadgeIdsString(approvalToAdd.badgeIds)}) and times ({getTimeRangesElement(approvalToAdd.ownershipTimes)}).
                      You can set the limit for the amount approved on an overall (all users), per recipient, per sender, and / or per approver basis.
                    </div>
                  </div>
                </>}
                {predeterminedType === PredeterminedType.Same && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='secondary-text'>
                    <div className=''>
                      <InfoCircleOutlined /> All or Nothing - Every use of this approval will approve the same badge IDs and ownership times (the selected ones). The approval is only valid though if they are all transferred together.
                    </div>
                  </div>
                </>}
                <br />
                {amountType === AmountType.Tally && predeterminedType === PredeterminedType.Dynamic && <>
                  <ApprovalAmountsComponent
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    type='overall' label='Overall (all cumulatively)' />
                  <ApprovalAmountsComponent approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='from' label='Per sender' />
                  <ApprovalAmountsComponent approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='to' label='Per recipient' />
                  <ApprovalAmountsComponent approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='initiatedBy' label='Per approver' />

                  {!approvalHasApprovalAmounts(approvalToAdd.approvalCriteria.approvalAmounts) && <div style={{ textAlign: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <WarningOutlined style={{ color: '#FF5733' }} />
                      <span style={{ marginLeft: 8, color: '#FF5733' }}>
                        Without any selections, there will be no amount restrictions (unlimited quantity approved).
                      </span>
                    </div>
                  </div>}
                  <br />
                  {AllMaxUses}
                </>}

                {amountType === AmountType.Tally && predeterminedType === PredeterminedType.Same && <>
                  {<>

                    {<div style={{ textAlign: 'center', margin: 10 }}>
                      <div style={{ textAlign: 'center', margin: 10 }}>
                        <NumberInput
                          title={'Amount per Use'}
                          min={1}
                          value={startBalances.length > 0 ? Number(startBalances[0].amount) : 0}
                          setValue={(amount) => {
                            if (amount < 0) amount = 0;
                            setApprovalToAdd({
                              ...approvalToAdd,
                              approvalCriteria: {
                                ...approvalToAdd.approvalCriteria,
                                predeterminedBalances: {
                                  ...approvalToAdd.approvalCriteria.predeterminedBalances,
                                  incrementedBalances: {
                                    ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                                    startBalances: [{
                                      badgeIds: approvalToAdd.badgeIds,
                                      ownershipTimes: approvalToAdd.ownershipTimes,
                                      amount: BigInt(amount),
                                    }],
                                  },
                                  orderCalculationMethod: {
                                    ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
                                    useOverallNumTransfers: true,
                                    usePerFromAddressNumTransfers: false,
                                    usePerInitiatedByAddressNumTransfers: false,
                                    usePerToAddressNumTransfers: false,
                                    useMerkleChallengeLeafIndex: false,
                                  }
                                }
                              }
                            });



                          }
                          }
                        />
                      </div>

                    </div>}
                    <br />
                    <BalanceDisplay
                      message={`Approved Badges ${getMaxIncrementsApplied(approvalToAdd) > 0n ? `(${getMaxIncrementsApplied(approvalToAdd)} Uses)` : 'per Use'}`}
                      collectionId={collectionId}
                      balances={startBalances}
                      incrementBadgeIdsBy={0n}
                      numIncrements={getMaxIncrementsApplied(approvalToAdd)}
                    />

                    {!approvalHasMaxNumTransfers(approvalToAdd.approvalCriteria.maxNumTransfers) && <div style={{ textAlign: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <WarningOutlined style={{ color: '#FF5733' }} />
                        <span style={{ marginLeft: 8, color: '#FF5733' }}>
                          This approval approves x{startBalances.length > 0 ? Number(startBalances[0].amount) : 0}{' '}of the selected badges
                          {' '}<b>per use</b> in an all or nothing manner.
                          However, you have not set a limit on max uses,
                          meaning an unlimited quantity is approved.
                        </span>
                      </div>
                    </div>}

                    <br />
                    {AllMaxUses}
                  </>}
                </>}
              </>}
              {amountType === AmountType.Predetermined && <>
                {predeterminedType === PredeterminedType.Dynamic && <>
                  <b style={{ fontSize: 16 }}> 1) Assigning Partitions</b>
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='useOverallNumTransfers' label='Increment per use?' />
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerToAddressNumTransfers' label='Increment per unique recipient?' />
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerFromAddressNumTransfers' label='Increment per unique sender' />
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerInitiatedByAddressNumTransfers' label='Increment per unique approved address?' />
                  <OrderCalculationMethod
                    expectedPartitions={expectedPartitions}
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='useMerkleChallengeLeafIndex' label='Specific codes / whitelisted addresses?' />
                  {/* if all are false watning message */}
                  {approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers === false &&
                    approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers === false &&
                    approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers === false &&
                    approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers === false &&
                    approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex === false &&
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <WarningOutlined style={{ color: 'red' }} />
                        <span style={{ marginLeft: 8, color: 'red' }}>
                          You must select at least one order calculation method.
                        </span>
                      </div>
                    </div>
                  }
                </>}
              </>
              }
            </Col>
          </div>}
        </InformationDisplayCard>
      </div >


      <div className='flex flex-wrap full-width'>
        <InformationDisplayCard title='Transfer Times' md={8} xs={24} sm={24} subtitle='When can this approval be used?'>
          <br />
          <Switch
            checked={isFullUintRanges(approvalToAdd.transferTimes)}
            checkedChildren="All Times"
            unCheckedChildren="Custom"
            onChange={(checked) => {
              if (checked) {
                setApprovalToAdd({
                  ...approvalToAdd,
                  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                });
              } else {
                setApprovalToAdd({
                  ...approvalToAdd,
                  transferTimes: [],
                });
              }
            }}
          />
          <br /> <br />
          <>
            {isFullUintRanges(approvalToAdd.transferTimes) ? <></> : <>
              {approvalToAdd.transferTimes.length == 0 && <div style={{ color: 'red' }}>
                <WarningOutlined /> Transfer times cannot be empty.
              </div>}
              <DateRangeInput
                timeRanges={approvalToAdd.transferTimes}
                setTimeRanges={(transferTimes) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    transferTimes,
                  });
                }}
              />
            </>
            }</>

        </InformationDisplayCard>
        <InformationDisplayCard title='Approval Info' md={16} xs={24} sm={24} subtitle='Provide optional metadata for the approval. Explain what it is for, how to get approved, etc.'>
          <ClaimMetadataSelect approvalDetails={approvalToAdd.details} setApprovalDetails={(details) => {
            setApprovalToAdd({
              ...approvalToAdd,
              details,
            });
          }} />

        </InformationDisplayCard>
      </div>
    </Row >
    < button className='landing-button' style={{ width: '100%', marginTop: 16 }
    }
      disabled={isAddressListEmpty(approvalToAdd.fromList) || isAddressListEmpty(approvalToAdd.toList) || isAddressListEmpty(approvalToAdd.initiatedByList)
        || approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0 || approvalToAdd.transferTimes.length === 0
        || uintRangesOverlap || uintRangesLengthEqualsZero || ownedTimesOverlap || ownedTimesLengthEqualsZero
        || (requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy) || (requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy)
        || (distributionMethod === DistributionMethod.Codes && codeType === CodeType.None || !!(distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable && !claimPassword))
        || approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.find(x => x.amount <= 0n || checkIfUintRangesOverlap(x.badgeIds) || checkIfUintRangesOverlap(x.ownershipTimes) || x.badgeIds.length === 0 || x.ownershipTimes.length === 0) ? true : false
        || ((approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0n || approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0n) &&
          (!approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex))
        || (nonMintOnlyApproval && isInAddressList(approvalToAdd.fromList, "Mint"))
        || (!!approvalsToAdd.find(x => x.approvalId === approvalToAdd.approvalId) && !defaultApproval)
        || (nonMintOnlyApproval && isInAddressList(approvalToAdd.fromList, "Mint"))
        || transferTimesOverlap || transferTimesLengthEqualsZero
      || (amountType === AmountType.Tally && predeterminedType === PredeterminedType.Same && ((startBalances.length > 0 ? Number(startBalances[0].amount) : 0) <= 0))
      }
      onClick={() => {
        //Set them here
        const codes = [];
        const addresses = [];

        const newApprovalToAdd: CollectionApprovalWithDetails<bigint> & { approvalCriteria: ApprovalCriteriaWithDetails<bigint> } = deepCopy(approvalToAdd);

        if (distributionMethod === DistributionMethod.Codes) {
          for (let i = 0; i < numRecipients; i++) {
            const code = crypto.randomBytes(32).toString('hex');
            codes.push(code);
          }

          const hashedCodes = codes.map(x => SHA256(x).toString());
          const treeOptions = { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }
          const codesTree = new MerkleTree(hashedCodes, SHA256, treeOptions);
          const codesRoot = codesTree.getRoot().toString('hex');

          const merkleChallenge: any = {
            root: '',
            expectedProofLength: 0n,
            uri: '',
            customData: '',
            useCreatorAddressAsLeaf: false,
            maxUsesPerLeaf: 0n,

          };

          const details = {
            challengeDetails: {
              leavesDetails: {
                leaves: [],
                isHashed: false
              }
            },
            name: newApprovalToAdd.details?.name || '',
            description: newApprovalToAdd.details?.description || ''
          } as any
          merkleChallenge.root = codesRoot ? codesRoot : '';
          merkleChallenge.expectedProofLength = BigInt(codesTree.getLayerCount() - 1);
          merkleChallenge.useCreatorAddressAsLeaf = false;
          merkleChallenge.maxUsesPerLeaf = 1n;

          details.challengeDetails.leavesDetails.leaves = hashedCodes;
          details.challengeDetails.leavesDetails.isHashed = true;
          details.challengeDetails.leavesDetails.preimages = codes;
          details.challengeDetails.numLeaves = BigInt(numRecipients);
          details.challengeDetails.password = claimPassword;
          details.challengeDetails.hasPassword = claimPassword ? true : false;
          details.challengeDetails.treeOptions = treeOptions;



          newApprovalToAdd.details = details

          newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>
        } else if (distributionMethod === DistributionMethod.Whitelist) {
          const toAddresses = approvalToAdd.initiatedByList.addresses;
          newApprovalToAdd.initiatedByList = getReservedAddressList("All");
          newApprovalToAdd.initiatedByListId = "All";

          addresses.push(...toAddresses.map(x => convertToCosmosAddress(x)));
          const treeOptions = { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }
          const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256, treeOptions);
          const addressesRoot = addressesTree.getRoot().toString('hex');

          const merkleChallenge: any = {
            root: '',
            expectedProofLength: 0n,
            uri: '',
            customData: '',
            useCreatorAddressAsLeaf: false,
            maxUsesPerLeaf: 0n,

          };
          const details = {
            challengeDetails: {
              leavesDetails: {
                leaves: [],
                isHashed: false
              }
            },
            name: newApprovalToAdd.details?.name || '',
            description: newApprovalToAdd.details?.description || ''
          } as any
          merkleChallenge.root = addressesRoot ? addressesRoot : '';
          merkleChallenge.expectedProofLength = BigInt(addressesTree.getLayerCount() - 1);
          merkleChallenge.useCreatorAddressAsLeaf = true;
          merkleChallenge.maxUsesPerLeaf = 0n;


          details.challengeDetails.leavesDetails.leaves = addresses
          details.challengeDetails.leavesDetails.isHashed = false;
          details.challengeDetails.numLeaves = BigInt(numRecipients);
          details.challengeDetails.password = ''
          details.challengeDetails.hasPassword = false;
          details.challengeDetails.treeOptions = treeOptions;

          newApprovalToAdd.details = details
          newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>
        } else {
          newApprovalToAdd.approvalCriteria.merkleChallenge = undefined;
          const details = {
            challengeDetails: {
              leavesDetails: {
                leaves: [],
                isHashed: false
              }
            },
            name: newApprovalToAdd.details?.name || '',
            description: newApprovalToAdd.details?.description || ''
          } as any
          newApprovalToAdd.details = details
        }

        const autoGenerateIds = true;
        if (autoGenerateIds) {
          newApprovalToAdd.amountTrackerId = amountTrackerId.current;
          newApprovalToAdd.approvalId = amountTrackerId.current;
          newApprovalToAdd.challengeTrackerId = amountTrackerId.current;
        }

        if (!newApprovalToAdd.details?.name && !newApprovalToAdd.details?.description && !newApprovalToAdd.details?.challengeDetails.leavesDetails.leaves.length) {
          newApprovalToAdd.details = undefined;
        }


        if (amountType === AmountType.Predetermined) {
          //We have been using approvalToAdd.badgeIds as the start badges, but we need to now set this to all possible badges
          const allPossibleBadgeIds = getAllApprovedBadges(approvalToAdd, amountType, startBalances, increment);
          newApprovalToAdd.badgeIds = allPossibleBadgeIds;
        }

        const newApprovalsToAdd = [...approvalsToAdd, deepCopy(newApprovalToAdd)]

        let isValidUpdateError = validateCollectionApprovalsUpdate(startingApprovals, newApprovalsToAdd, approvalPermissions);


        if (isValidUpdateError && !confirm("This update is disallowed by the collection permissions. Please confirm this was intended. Details: " + isValidUpdateError.message)) {

          return;
        }

        //We need to replace the existing one
        if (defaultApproval) {
          setApprovalsToAdd([...approvalsToAdd.map(x => x.approvalId === approvalToAdd.approvalId ? deepCopy(newApprovalToAdd) : x)]);

        } else {
          setApprovalsToAdd([...approvalsToAdd, deepCopy(newApprovalToAdd)]);
        }

        setApprovalToAdd(deepCopy(defaultApprovalToAdd));

        if (setVisible) setVisible(false);
      }
      }>

      {isEdit ? 'Edit Approval' : 'Set Approval'}
    </button >
    {
      isEdit && <div className='flex-center secondary-text'>
        <InfoCircleOutlined /> This will overwrite the approval you selected to edit.
      </div>
    }
    <br />

  </>
}