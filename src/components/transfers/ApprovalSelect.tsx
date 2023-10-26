import { InfoCircleOutlined, LockOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Col, Input, Radio, Row, Switch, Tag, Tooltip, Typography } from 'antd';
import { AddressMapping, Balance, MustOwnBadges, deepCopy } from 'bitbadgesjs-proto';
import { ApprovalCriteriaWithDetails, CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, DistributionMethod, MerkleChallengeWithDetails, checkIfUintRangesOverlap, convertToCosmosAddress, getAllBalancesToBeTransferred, getReservedAddressMapping, isAddressMappingEmpty, isFullUintRanges, isInAddressMapping, sortUintRangesAndMergeIfNecessary, validateCollectionApprovalsUpdate } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useRef, useState } from 'react';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BadgeIdRangesInput } from '../inputs/BadgeIdRangesInput';
import { BalanceInput } from '../inputs/BalanceInput';
import { DateRangeInput } from '../inputs/DateRangeInput';
import { NumberInput } from '../inputs/NumberInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { ClaimMetadataSelect } from './ClaimMetadataSelectStep';
import { AddressMappingSelectComponent } from './ApprovalSelectHelpers/AddressMappingSelectComponent';
import { ApprovalAmounts } from './ApprovalSelectHelpers/ApprovalAmountsSelectComponent';
import { MaxUses } from './ApprovalSelectHelpers/MaxUsesSelectComponent';
import { OrderCalculationMethod } from './ApprovalSelectHelpers/OrderCalculationComponent';

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
}

export type RequiredApprovalProps = CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>> };

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
    const allApprovedBadges = sortUintRangesAndMergeIfNecessary(getAllBalancesToBeTransferred([
      {
        from: '',
        balances: startBalances.map(x => { return { ...x, amount: 1n } }),
        toAddressesLength: maxIncrementsApplied,
        toAddresses: [],
        incrementBadgeIdsBy: increment > 0 ? increment : 0n,
        incrementOwnershipTimesBy: 0n,
      }
    ], true).map(x => x.badgeIds).flat(), true);
    return allApprovedBadges;
  }
}




export function ApprovalSelect({
  collectionId,
  plusButton,
  setVisible,
  distributionMethod,
  setDistributionMethod,
  defaultFromMapping,
  fromMappingLocked,
  defaultApproval,
  showMintingOnlyFeatures,
  defaultToMapping,
  defaultInitiatedByMapping,
  toMappingLocked,
  initiatedByMappingLocked,
  approvalsToAdd,
  setApprovalsToAdd,
  hideCollectionOnlyFeatures,
  startingApprovals,
  approvalPermissions
}: {
  fromMappingLocked?: boolean;
  defaultFromMapping?: AddressMapping,
  defaultToMapping?: AddressMapping,
  defaultInitiatedByMapping?: AddressMapping,
  toMappingLocked?: boolean;
  initiatedByMappingLocked?: boolean;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  setDistributionMethod: (distributionMethod: DistributionMethod) => void;
  plusButton?: boolean;
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
  const nonMintOnlyApproval = defaultFromMapping?.mappingId === 'AllWithoutMint';
  const [showMustOwnBadges, setShowMustOwnBadges] = useState(false);
  const [codeType, setCodeType] = useState(CodeType.None);
  const mustEditApprovalIds = !defaultApproval;
  const [autoGenerateIds, setAutoGenerateIds] = useState(defaultApproval ? false : true);
  const [editApprovalIds, setEditApprovalIds] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [predeterminedType, setPredeterminedType] = useState(PredeterminedType.Same);

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));

  const defaultApprovalToAdd: CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>> } = {
    fromMappingId: defaultFromMapping ? defaultFromMapping.mappingId : 'Mint',
    fromMapping: defaultFromMapping ? defaultFromMapping : getReservedAddressMapping("Mint"),
    toMappingId: defaultToMapping ? defaultToMapping.mappingId : 'AllWithMint',
    toMapping: defaultToMapping ? defaultToMapping : getReservedAddressMapping("AllWithMint"),
    initiatedByMappingId: defaultInitiatedByMapping ? defaultInitiatedByMapping.mappingId : 'AllWithMint',
    initiatedByMapping: defaultInitiatedByMapping ? defaultInitiatedByMapping : getReservedAddressMapping("AllWithMint"),
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: [],
    approvalId: '',
    amountTrackerId: '',
    challengeTrackerId: '',
    details: {
      name: '',
      description: '',
      hasPassword: false,
      challengeDetails: {
        leavesDetails: {
          leaves: [],
          isHashed: false,
        },
      }
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
      overridesFromOutgoingApprovals: true,

      ...defaultApproval
    }
  }



  const [approvalToAdd, setApprovalToAdd] = useState<CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>> }>(deepCopy(defaultApprovalToAdd));

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

  const [amountType, setAmountType] = useState<AmountType>(AmountType.Tally);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('amountType', amountType);
    const newPredeterminedBalances = [];
    const newApprovalAmounts = approvalToAdd.approvalCriteria.approvalAmounts;

    if (amountType === AmountType.Predetermined) {
      newPredeterminedBalances.push({
        amount: 1n,
        badgeIds: deepCopy(approvalToAdd.badgeIds),
        ownershipTimes: deepCopy(approvalToAdd.ownershipTimes),
      });

      newApprovalAmounts.overallApprovalAmount = 0n;
      newApprovalAmounts.perFromAddressApprovalAmount = 0n;
      newApprovalAmounts.perInitiatedByAddressApprovalAmount = 0n;
      newApprovalAmounts.perToAddressApprovalAmount = 0n;
    }

    setApprovalToAdd({
      ...approvalToAdd,

      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        approvalAmounts: {
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
    });
  }, [amountType, approvalToAdd.badgeIds]);

  const PasswordSelect = <div style={{ textAlign: 'center' }}>

    <br />
    <b style={{ textAlign: 'center' }}>Password</b>
    <Input
      value={claimPassword}
      onChange={(e) => {
        setClaimPassword?.(e.target.value);
      }}
      className='dark:text-white inherit-bg'
    />
    {!claimPassword && <div style={{ color: 'red' }}>Password cannot be empty.</div>}
  </div>

  const LearnMore = <div style={{ textAlign: 'center' }} className='text-gray-400'>
    <br />
    <p>
      <InfoCircleOutlined /> Note that this is a centralized solution. <Tooltip color='black' title="For a better user experience, codes and passwords are stored in a centralized manner via the BitBadges servers. This makes it easier for you (the collection creator) by eliminating storage requirements. For a decentralized solution, you can store your own codes and interact directly with the blockchain (see documentation).">
        Hover to learn more.
      </Tooltip>
    </p>
  </div>

  return <>
    <Typography.Text style={{ textAlign: 'center' }} className="text-gray-400">
      <WarningOutlined style={{ marginRight: 5, color: 'orange' }} />
      Below, you are creating an approval.
      Approvals determine the rules for how badges can be transferred but do not actually transfer the badges.
      For any transfer to be successful, there must be a valid approval and sufficient balances.
    </Typography.Text>
    <br /><br />
    <Row style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='dark:text-white'>

      <div className='flex flex-wrap full-width'>
        <InformationDisplayCard title={<>From <LockOutlined /></>} md={8} xs={24} sm={24} subtitle='Who can send the badges?'>
          <AddressMappingSelectComponent
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} nonMintOnlyApproval={nonMintOnlyApproval}
            type='from' disabled={fromMappingLocked} />
          {!hideCollectionOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Do not check outgoing approvals?'} value={<Switch
            disabled={fromMappingLocked}
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
            disabled={fromMappingLocked}
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
            disabled={fromMappingLocked}
          />} />

          {requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy && <div style={{ color: 'red' }}>Sender cannot be both approver and not approver.</div>}

          <MaxUses
            disabled={fromMappingLocked}
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
            label={'Max uses per sender'} type='from' />


        </InformationDisplayCard>
        <InformationDisplayCard title='To' md={8} xs={24} sm={24} subtitle='Who can receive the badges?'>
          <AddressMappingSelectComponent
            disabled={toMappingLocked}
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
            type='to' />
          {!hideCollectionOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Do not check incoming approvals?'} value={<Switch
            disabled={toMappingLocked}
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
            disabled={toMappingLocked}
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
            disabled={toMappingLocked}
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
          <MaxUses disabled={toMappingLocked} approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per recipient'} type='to' />

        </InformationDisplayCard>
        <InformationDisplayCard title='Approved' md={8} xs={24} sm={24} subtitle='Who is approved to initiate the transfer?'>
          <AddressMappingSelectComponent
            disabled={initiatedByMappingLocked}
            approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
            type='initiatedBy' />
          {approvalToAdd.initiatedByMapping.includeAddresses && showMintingOnlyFeatures && <TableRow labelSpan={16} valueSpan={8} label={'Store whitelist off-chain?'} value={
            <Switch
              disabled={initiatedByMappingLocked}
              checked={distributionMethod === DistributionMethod.Whitelist} onChange={(checked) => {
                if (checked) {
                  setDistributionMethod(DistributionMethod.Whitelist);
                } else {
                  setDistributionMethod(DistributionMethod.None);
                }
              }} />
          } />}


          {showMintingOnlyFeatures && !initiatedByMappingLocked &&
            <TableRow labelSpan={16} valueSpan={8} label={
              <>
                Gate who initiates with secret codes or a password?


              </>
            } value={<>
              <div>
                <Switch
                  disabled={distributionMethod === DistributionMethod.Whitelist}
                  checked={distributionMethod === DistributionMethod.Codes}
                  onChange={(checked) => {
                    if (checked) {
                      setDistributionMethod(DistributionMethod.Codes);
                      setAmountType(AmountType.Tally);
                      setPredeterminedType(PredeterminedType.Same);
                      setApprovalToAdd({
                        ...approvalToAdd,
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
                  }}
                />
              </div>
            </>
            } />}

          {distributionMethod !== DistributionMethod.Codes && showMintingOnlyFeatures && <div className='' style={{ textAlign: 'start', marginLeft: 10, marginBottom: 4 }}>

            <Typography.Text strong className='text-gray-400' style={{ fontSize: 12 }}>
              <InfoCircleOutlined /> {distributionMethod === DistributionMethod.Whitelist ? "Incompatible with off-chain whitelists."
                : "Code / password based approvals are incompatible with tally-based approvals and off-chain whitelists."}

            </Typography.Text>
          </div>}

          {distributionMethod !== DistributionMethod.Codes && <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={initiatedByMappingLocked} />}
          {distributionMethod !== DistributionMethod.Codes && <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per approver'} type='initiatedBy' disabled={initiatedByMappingLocked} />}
          {distributionMethod === DistributionMethod.Codes && <>
            {distributionMethod === DistributionMethod.Codes && LearnMore}
            <SwitchForm
              fullWidthCards
              options={[{
                title: 'Unique Codes',
                message: 'Codes will be uniquely generated and one-time use only. You can distribute these codes how you would like.',
                isSelected: codeType === CodeType.Unique,
                additionalNode: <div className='flex-center flex-wrap flex-column'>
                  <MaxUses isCodeDisplay approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={initiatedByMappingLocked} />
                  <br />
                  <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per approver'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable || initiatedByMappingLocked} />

                </div>,
              },
              {
                title: 'Password',
                message: `You enter a custom password that is to be used by all claimees (e.g. attendance code). Limited to one use per address.`,
                isSelected: codeType === CodeType.Reusable,
                additionalNode: <>
                  <MaxUses isPasswordDisplay approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={initiatedByMappingLocked} />
                  <br />
                  <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per approver'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable || initiatedByMappingLocked} />

                  {PasswordSelect}
                </>
              }]}
              onSwitchChange={(option, _title) => {
                if (option === 0) {
                  setCodeType(CodeType.Unique);
                } else {
                  setCodeType(CodeType.Reusable);
                  setApprovalToAdd({
                    ...approvalToAdd,
                    approvalCriteria: {
                      ...approvalToAdd.approvalCriteria,
                      maxNumTransfers: {
                        ...approvalToAdd.approvalCriteria.maxNumTransfers,
                        perInitiatedByAddressMaxNumTransfers: 1n,
                      }
                    }
                  });
                }
                setClaimPassword('');
              }}

            />
          </>}


          <TableRow labelSpan={16} valueSpan={8} label={<>Must own badges?</>}
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
            >
              <div className='dark:text-white'>
                <br />

                <BalanceInput
                  fullWidthCards


                  isMustOwnBadgesInput
                  message="Must Own Badges"
                  hideOwnershipTimes
                  balancesToShow={mustOwnBadges.map(x => {
                    return {
                      ...x,
                      amount: x.amountRange.start,
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    }
                  })}
                  mustOwnBadges={mustOwnBadges}
                  onAddBadges={(balance, amountRange, collectionId) => {
                    if (!collectionId || !amountRange) return;

                    setMustOwnBadges([...mustOwnBadges, {
                      collectionId: collectionId,
                      overrideWithCurrentTime: true,
                      amountRange: amountRange,
                      badgeIds: balance.badgeIds,
                      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      mustOwnAll: true
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
          <br />
          <BadgeIdRangesInput
            fullWidthCards
            collectionId={collectionId}
            uintRanges={approvalToAdd?.badgeIds || []}
            setUintRanges={(uintRanges) => {
              setApprovalToAdd({
                ...approvalToAdd,
                badgeIds: uintRanges,
              });
            }}
            uintRangeBounds={[{ start: 1n, end: GO_MAX_UINT_64 }]}
            hideSelect
            hideNumberSelects
          />

        </InformationDisplayCard>

        <InformationDisplayCard md={8} xs={24} sm={24} title='Ownership Times' subtitle='Which ownership times for the badges are approved to be transferred?'>
          <br />
          <SwitchForm
            fullWidthCards
            options={[
              {
                title: "All Times",
                message: "Approve transferring ownership for all times.",
                isSelected: isFullUintRanges(approvalToAdd.ownershipTimes),

              },
              {
                title: "Custom",
                message: "Approve transferring ownership only for the selected times.",
                isSelected: !(isFullUintRanges(approvalToAdd.ownershipTimes)),
                additionalNode: <>
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
              },
            ]}
            onSwitchChange={(value) => {
              if (value === 0) {
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

        </InformationDisplayCard>
        <InformationDisplayCard md={8} xs={24} sm={24} title='Amounts' subtitle='Select the amounts to approve.'>
          {(approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0) && <div style={{ color: 'red' }}>
            <WarningOutlined /> Badge IDs and / or ownership times cannot be empty.
          </div>}
          {approvalToAdd.badgeIds.length > 0 && approvalToAdd.ownershipTimes.length > 0 && <div className='flex-center'>

            <Col >

              {showMintingOnlyFeatures && <><br /><b style={{ fontSize: 14 }}> Select Type</b><br />
                <Radio.Group buttonStyle='solid' value={amountType} onChange={(e) => {
                  setAmountType(e.target.value);
                  setPredeterminedType(e.target.value === AmountType.Predetermined ? PredeterminedType.Dynamic : PredeterminedType.Same);

                }}>
                  <Radio.Button value={AmountType.Tally}>Standard {distributionMethod === DistributionMethod.Codes ? " - All or Nothing" : ""}</Radio.Button>
                  <Radio.Button value={AmountType.Predetermined}>Partitions</Radio.Button>
                </Radio.Group></>
              }


              {amountType === AmountType.Tally && <>

                {distributionMethod !== DistributionMethod.Codes && <><br /><br />
                  <Radio.Group buttonStyle='solid' value={predeterminedType !== PredeterminedType.Same ? "tally" : "all"} onChange={(e) => {
                    if (e.target.value === "tally") {
                      setAmountType(AmountType.Tally);
                      setPredeterminedType(PredeterminedType.Dynamic);
                    }
                    if (e.target.value === "all") {
                      setAmountType(AmountType.Tally);
                      setPredeterminedType(PredeterminedType.Same);
                    }
                  }}>
                    <Radio.Button value={"all"}  >All or Nothing</Radio.Button>
                    <Radio.Button value={"tally"}>Tally</Radio.Button>
                  </Radio.Group></>
                }
                {predeterminedType !== PredeterminedType.Same && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='text-gray-400'>
                    <div className=''>
                      <InfoCircleOutlined /> Tally - Approvals will correspond to the selected badge IDs ({getBadgeIdsString(approvalToAdd.badgeIds)}) and times ({getTimeRangesElement(approvalToAdd.ownershipTimes)}).
                      You can set the limit for the amount approved on an overall (all users), per recipient, per sender, and / or per approver basis.
                    </div>
                  </div>
                </>}
                {predeterminedType === PredeterminedType.Same && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='text-gray-400'>
                    <div className=''>
                      <InfoCircleOutlined /> All or Nothing - Every use of this approval will approve the same badge IDs and ownership times (the selected ones). The approval is only valid if they are all transferred at once via one transfer.
                    </div>
                  </div>
                </>}
                <br />
                {amountType === AmountType.Tally && predeterminedType !== PredeterminedType.Same && <>
                  <ApprovalAmounts
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    type='overall' label='Overall (all users)' />
                  <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='from' label='Per sender' />
                  <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='to' label='Per recipient' />
                  <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='initiatedBy' label='Per approver' />

                  {!approvalHasApprovalAmounts(approvalToAdd.approvalCriteria.approvalAmounts) && <div style={{ textAlign: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <WarningOutlined style={{ color: 'orange' }} />
                      <span style={{ marginLeft: 8, color: 'orange' }}>
                        Without any selections, there will be no amount restrictions (unlimited quantity approved).
                      </span>
                    </div>
                  </div>}
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
                        <WarningOutlined style={{ color: 'orange' }} />
                        <span style={{ marginLeft: 8, color: 'orange' }}>
                          Without any max uses restrictions, this approval can be used an unlimited number of times. Thus, the selected badges are approved in unlimited quantity.
                        </span>
                      </div>
                    </div>}
                  </>}
                </>}
              </>}
              {amountType === AmountType.Predetermined && <>
                <br />

                {predeterminedType === PredeterminedType.Dynamic &&
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='text-gray-400'>
                    <div className=''>
                      <InfoCircleOutlined /> Partitions -

                      We will split the badge IDs into N partitions (with the selected badge IDs as partition #1).
                      For each approval, we will calculate which partition of badge IDs to approve dynamically.
                    </div>
                  </div>}
                {predeterminedType === PredeterminedType.Same &&
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='text-gray-400'>
                    <div className=''>
                      <InfoCircleOutlined /> All or Nothing - Every use of this approval will approve the same badge IDs and ownership times (the selected ones). The approval is only valid if they are all transferred at once via one transfer.
                    </div>
                  </div>}
                <br />
                <hr />
                {predeterminedType === PredeterminedType.Dynamic && <>
                  <b style={{ fontSize: 16 }}> Assigning Partitions</b>
                  <OrderCalculationMethod
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='useOverallNumTransfers' label='Increment every use?' />
                  <OrderCalculationMethod
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerToAddressNumTransfers' label='Increment per unique to address?' />
                  <OrderCalculationMethod
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerFromAddressNumTransfers' label='Increment per unique from address?' />
                  <OrderCalculationMethod
                    approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                    amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
                    increment={increment} startBalances={startBalances}
                    keyId='usePerInitiatedByAddressNumTransfers' label='Increment per unique approved address?' />
                  <OrderCalculationMethod
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
      </div>


      <div className='flex flex-wrap full-width'>
        <InformationDisplayCard title='Transfer Times' md={8} xs={24} sm={24} subtitle='When is this approval valid?'>
          <SwitchForm
            fullWidthCards
            options={[
              {
                title: "All Times",
                message: "This approval is valid at all timess.",
                isSelected: isFullUintRanges(approvalToAdd.transferTimes),

              },
              {
                title: "Custom",
                message: "This approval is valid only at the selected times.",
                isSelected: !(isFullUintRanges(approvalToAdd.transferTimes)),
                additionalNode: <>
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
              },
            ]}
            onSwitchChange={(value) => {
              if (value === 0) {
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

        </InformationDisplayCard>
        <InformationDisplayCard title='Approval Info' md={8} xs={24} sm={24} subtitle='Provide optional metadata for the approval. Explain what it is for, how to get approved, etc.'>
          <ClaimMetadataSelect approvalDetails={approvalToAdd.details} setApprovalDetails={(details) => {
            setApprovalToAdd({
              ...approvalToAdd,
              details,
            });
          }} />

        </InformationDisplayCard>
        <InformationDisplayCard title='Start Point' md={8} xs={24} sm={24} subtitle='Decide to start from  scratch or from a prior approval.'>
          <br />
          <TableRow labelSpan={16} valueSpan={8} label={'Start from scratch?'} value={<Switch
            checked={autoGenerateIds}
            onChange={(checked) => {
              setAutoGenerateIds(checked);
            }}
          />} />
          {!autoGenerateIds && !mustEditApprovalIds && <div style={{ textAlign: 'center' }}>
            <TableRow labelSpan={16} valueSpan={8} label={'Edit approval IDs (advanced)?'} value={<Switch
              checked={editApprovalIds}
              onChange={(checked) => {
                setEditApprovalIds(checked);
              }}
            />} />
          </div>}
          {autoGenerateIds && <div style={{ textAlign: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <br />
              <span style={{ marginLeft: 8 }}>
                This approval will be  <Tag
                  style={{ margin: 4, backgroundColor: '#52c41a' }}
                  color='#52c41a'
                  className='dark:text-white'
                >New</Tag> meaning it will have no prior history and not be based on any prior approvals.


              </span>
            </div>
          </div>}


          {
            !autoGenerateIds && <>

              <br />
              <b style={{ fontSize: 16 }}> Approval ID</b >
              <Input
                disabled={!editApprovalIds && !mustEditApprovalIds}
                className='dark:text-white inherit-bg'
                value={approvalToAdd.approvalId}
                onChange={(e) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    approvalId: e.target.value,
                  });
                }}
                placeholder='Approval ID'
              />
              <b style={{ fontSize: 16 }}>Amount Tracker ID</b>
              <Input
                disabled={!editApprovalIds && !mustEditApprovalIds}
                className='dark:text-white inherit-bg'
                value={approvalToAdd.amountTrackerId}
                onChange={(e) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    amountTrackerId: e.target.value,
                  });
                }}
                placeholder='Amount Tracker ID'
              />
              <br />
              <b style={{ fontSize: 16 }}>Challenge Tracker ID</b>
              <Input
                disabled={!editApprovalIds && !mustEditApprovalIds}
                className='dark:text-white inherit-bg'
                value={approvalToAdd.challengeTrackerId}
                onChange={(e) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    challengeTrackerId: e.target.value,
                  });
                }}
                placeholder='Challenge Tracker ID'
              />
            </>}
          {!autoGenerateIds && <div style={{ textAlign: 'center' }}>
            <div style={{ textAlign: 'center', color: 'orange' }}>
              <br />
              <span style={{ marginLeft: 8 }}>
                <InfoCircleOutlined /> Editing IDs is advanced and not recommended. Learn more <a href='https://docs.bitbadges.io/for-developers/concepts/approval-criteria' target='_blank'>here</a>.
              </span>
            </div>
          </div>}
        </InformationDisplayCard >
      </div>

    </Row >
    {/* <br />
    <div className='full-width'>
      <Divider />
      <Typography.Text strong className='dark:text-white' style={{ fontSize: 20 }}>
        Summary
      </Typography.Text>
      <table style={{ width: '100%', fontSize: 16, marginTop: 10 }}>
        {getTableHeader()}
        <br />
        <TransferabilityRow transfer={approvalToAdd} allTransfers={approvalsToAdd} collectionId={collectionId} />
      </table>
      <Divider />
    </div > */}
    < button className='landing-button' style={{ width: '100%', marginTop: 16 }
    }
      disabled={isAddressMappingEmpty(approvalToAdd.fromMapping) || isAddressMappingEmpty(approvalToAdd.toMapping) || isAddressMappingEmpty(approvalToAdd.initiatedByMapping)
        || approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0 || approvalToAdd.transferTimes.length === 0
        || uintRangesOverlap || uintRangesLengthEqualsZero || ownedTimesOverlap || ownedTimesLengthEqualsZero
        || (requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy) || (requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy)
        || (distributionMethod === DistributionMethod.Codes && codeType === CodeType.None || !!(distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable && !claimPassword))
        || approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.find(x => x.amount <= 0n || checkIfUintRangesOverlap(x.badgeIds) || checkIfUintRangesOverlap(x.ownershipTimes) || x.badgeIds.length === 0 || x.ownershipTimes.length === 0) ? true : false
        || ((approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0n || approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0n) &&
          (!approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers && !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex))
        || (nonMintOnlyApproval && isInAddressMapping(approvalToAdd.fromMapping, "Mint"))
        || (!!approvalsToAdd.find(x => x.approvalId === approvalToAdd.approvalId) && !defaultApproval)
      || (nonMintOnlyApproval && isInAddressMapping(approvalToAdd.fromMapping, "Mint"))
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
          const toAddresses = approvalToAdd.initiatedByMapping.addresses;
          newApprovalToAdd.initiatedByMapping = getReservedAddressMapping("AllWithMint");
          newApprovalToAdd.initiatedByMappingId = "AllWithMint";

          console.log("toAddresses", toAddresses);

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

        let isValidUpdateError = null;
        if (startingCollection) {
          isValidUpdateError = validateCollectionApprovalsUpdate(startingApprovals, newApprovalsToAdd, approvalPermissions);
        }

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
      {plusButton ? <PlusOutlined /> : 'Set Approval'}
    </button >

  </>
}