import { InfoCircleOutlined, LockOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Col, Divider, Input, Radio, Row, Switch, Tag, Tooltip, Typography } from 'antd';
import { AddressMapping, Balance, MustOwnBadges, Numberify, UintRange, deepCopy } from 'bitbadgesjs-proto';
import { ApprovalCriteriaWithDetails, BalancesActionPermissionUsedFlags, CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, DistributionMethod, MerkleChallengeWithDetails, castBalancesActionPermissionToUniversalPermission, checkIfUintRangesOverlap, convertToCosmosAddress, getAllBalancesToBeTransferred, getReservedAddressMapping, invertUintRanges, isAddressMappingEmpty, isFullUintRanges, isInAddressMapping, sortUintRangesAndMergeIfNecessary, validateCollectionApprovalsUpdate } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalHasApprovalAmounts } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { AddressMappingSelect } from '../address/AddressMappingSelect';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { getPermissionDetails } from '../collection-page/PermissionsInfo';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BadgeIdRangesInput } from '../inputs/BadgeIdRangesInput';
import { BalanceAmountInput } from '../inputs/BalanceAmountInput';
import { BalanceInput } from '../inputs/BalanceInput';
import { DateRangeInput } from '../inputs/DateRangeInput';
import { NumberInput } from '../inputs/NumberInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
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

type RequiredApprovalProps = CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>> };
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

const getMaxIncrementsApplied = (
  approvalToAdd: RequiredApprovalProps,
) => {
  const checkedKeyId = Object.entries(approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).find(([, val]) => val === true)?.[0];
  let maxIncrementsApplied = 0n;
  if (checkedKeyId === 'useOverallNumTransfers' || checkedKeyId === 'useMerkleChallengeLeafIndex') {
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


const getAllApprovedBadges = (
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
        merkleProofs: [],
        precalculateBalancesFromApproval: {
          approvalId: '',
          approvalLevel: '',
          approverAddress: '',
        },
        memo: '',
        prioritizedApprovals: [],
        onlyCheckPrioritizedApprovals: false,

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

const OrderCalculationMethod = ({ approvalToAdd,
  setApprovalToAdd,
  distributionMethod,
  codeType,
  increment,
  startBalances,
  collectionId,
  amountType,

  keyId, label }:
  {
    amountType: AmountType,
    distributionMethod: DistributionMethod, codeType: CodeType, increment: bigint, startBalances: Balance<bigint>[], collectionId: bigint,
    setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
    approvalToAdd: RequiredApprovalProps, label: string, keyId: 'useOverallNumTransfers' | 'usePerToAddressNumTransfers' | 'usePerFromAddressNumTransfers' | 'usePerInitiatedByAddressNumTransfers' | 'useMerkleChallengeLeafIndex'

  }) => {
  const checked = approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod?.[keyId] || false;
  const setChecked = (checked: boolean) => {
    console.log("SETTING CHECKED");
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        predeterminedBalances: {
          ...approvalToAdd.approvalCriteria.predeterminedBalances,
          orderCalculationMethod: {
            ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
            useMerkleChallengeLeafIndex: false,
            useOverallNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            usePerToAddressNumTransfers: false,
            [keyId]: checked,
          }
        }
      }
    });

  }

  const somethingElseChecked = Object.entries(approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).some(([key, val]) => key !== keyId && val === true);
  if (somethingElseChecked) return <></>

  let maxUsesErrorMessage = '';
  if (keyId === 'useMerkleChallengeLeafIndex' || keyId === 'useOverallNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set an overall max uses.';
  } else if (keyId === 'usePerFromAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per sender.';
  } else if (keyId === 'usePerInitiatedByAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per initiator.';
  } else if (keyId === 'usePerToAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per recipient.';
  }

  const maxIncrementsApplied = getMaxIncrementsApplied(approvalToAdd);

  return <><TableRow labelSpan={16} valueSpan={8} label={label} value={<>
    <Switch
      disabled={keyId === 'useMerkleChallengeLeafIndex' && distributionMethod !== DistributionMethod.Codes && distributionMethod !== DistributionMethod.Whitelist}
      checked={checked}
      onChange={(checked) => {
        setChecked(checked);
      }}
    />
  </>
  } />
    {
      <div style={{ textAlign: 'start', marginLeft: 10, marginBottom: 10 }}>
        <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
          <InfoCircleOutlined />
          {keyId == 'useOverallNumTransfers' ? ' First use of this approval will be assigned partition #1, second use of this approval partition #2, and so on regardless of who sends, receives, or initiates.' : ''}
          {keyId == 'usePerFromAddressNumTransfers' ? ' Each unique sender will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'usePerInitiatedByAddressNumTransfers' ? ' Each unique initiator will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'usePerToAddressNumTransfers' ? ' Each unique recipient will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'useMerkleChallengeLeafIndex' ?
            distributionMethod === DistributionMethod.Whitelist ? ' Reserve specific partitions for specific whitelisted users.' :
              distributionMethod === DistributionMethod.Codes ? codeType === CodeType.Unique ?
                ' Reserve specific partitions for specific codes.' :
                ' Reserve specific partitions for specific passwords.' :
                ' Reserve specific partitions for specific users / codes.' : ''}
        </Typography.Text>
      </div>
    }
    {checked && <>
      <hr />
      <b style={{ fontSize: 16 }}> Number of Partitions</b>
      <br />
      <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> The number of partitions is calculated according to how many times users can send, receive, and / or initiate.
        Note the Max Uses selections are the same as above in the address boxes.
      </Typography.Text>
      <br />

      <br />
      {<div style={{}}>
        {maxUsesErrorMessage && <div style={{ color: 'red' }}>{maxUsesErrorMessage}</div>}
        {!maxUsesErrorMessage && <Typography.Text className='primary-text' strong style={{ fontSize: 16 }}>Total Partitions: {maxIncrementsApplied.toString()}</Typography.Text>}
        <br />
        <br />
      </div>}

      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses (all cumulatively)'} type='overall' disabled={distributionMethod === DistributionMethod.Codes} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses per initiator'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses per sender'} type='from' disabled />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
        label={'Max uses per recipient'} type='to' />
      <br />

      {maxIncrementsApplied > 0n && !maxUsesErrorMessage && <>
        <hr />
        <b style={{ fontSize: 16 }}> Amounts and IDs per Partition</b>
        <br />
        {(increment ? increment : 0) > 0 && <div style={{ textAlign: 'center', margin: 10 }}>
          {<div>
            {<div className='flex-center'>
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

              <div style={{ textAlign: 'center', margin: 10 }}>
                <BalanceAmountInput
                  title={'Amount'}
                  balances={startBalances}
                  setBalances={(balances) => {
                    setApprovalToAdd({
                      ...approvalToAdd,
                      approvalCriteria: {
                        ...approvalToAdd.approvalCriteria,
                        predeterminedBalances: {
                          ...approvalToAdd.approvalCriteria.predeterminedBalances,
                          incrementedBalances: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                            startBalances: balances,
                          }
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>}
          </div>}
        </div>
        }

        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ marginLeft: 8 }}>
              {increment === 0n && 'Each use of this approval will transfer the following badges: '}
              {increment ? `Partition #1 = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat())}.` : ''}
            </div>

            {maxIncrementsApplied > 1n &&
              <div style={{ marginLeft: 8 }}>

                {increment ? `Partition #2 = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment, end: x.end + increment } }))}.` : ''}

              </div>}

            {maxIncrementsApplied > 2n &&
              <div style={{ marginLeft: 8 }}>
                <div style={{ marginLeft: 8 }}>
                  ...
                </div>
                <div style={{ marginLeft: 8 }}>
                  {increment ? `Partition #${maxIncrementsApplied} = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment * (maxIncrementsApplied - 1n), end: x.end + increment * (maxIncrementsApplied - 1n) } }))}.` : ''}
                </div>
              </div>}
          </div>
        </div>
        <br />
        <hr />
        <BalanceDisplay
          message={'Approved Badges - All Partitions'}
          collectionId={collectionId}
          balances={startBalances}
          incrementBadgeIdsBy={increment}
          numIncrements={maxIncrementsApplied}
        />
      </>}
    </>
    }
  </>
}


const AddressMappingSelectComponent = ({
  approvalToAdd, setApprovalToAdd,
  type, disabled,
  collectionId

}: {
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  type: 'to' | 'from' | 'initiatedBy', disabled?: boolean, storedOffChain?: boolean,
  collectionId: bigint
}) => {
  const collections = useCollectionsContext();

  const key = type === 'to' ? 'toMapping' : type === 'initiatedBy' ? 'initiatedByMapping' : 'fromMapping';
  const idKey = type === 'to' ? 'toMappingId' : type === 'initiatedBy' ? 'initiatedByMappingId' : 'fromMappingId';

  const mapping = approvalToAdd[key];
  const setMapping = (mapping: AddressMapping) => {

    setApprovalToAdd({
      ...approvalToAdd,
      [key]: mapping,
      [idKey]: mapping.mappingId,
    });
  }

  const collection = collections.getCollection(collectionId);
  const lockedBadges = getPermissionDetails(
    castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []),
    BalancesActionPermissionUsedFlags
  );
  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary([...lockedBadges.dataSource.map(x => x.forbidden ? x.badgeIds : undefined).filter(x => x !== undefined).flat() as UintRange<bigint>[]], true);
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  return <>
    <AddressMappingSelect
      addressMapping={mapping}
      setAddressMapping={setMapping}
      disabled={disabled}
      showErrorOnEmpty
    />
    {!disabled && <>
      <div className=''>
        <InfoCircleOutlined /> Each added address increases your transaction fee{type === 'initiatedBy' && mapping.includeAddresses ? ' if stored on-chain' : ''}.
      </div> </>}

    {key === 'fromMapping' && approvalToAdd.fromMappingId === 'Mint' && <>
      <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> Below is the current balances of the Mint address (including any newly created badges).
        {unlockedBadgeIds.length > 0 && <>
          Also, note that you have selected to be able to create more badges in the future for the following IDs: {getBadgeIdsString(unlockedBadgeIds)}.</>}
      </Typography.Text>
      <BalanceDisplay
        message={'Unminted Balances'}
        hideMessage
        hideBadges
        collectionId={collectionId}
        balances={collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || []}
      />
    </>
    }
    <Divider />
  </>
}

const MaxUses = ({ label, disabled, type,
  approvalToAdd, setApprovalToAdd, amountType, codeType, distributionMethod

}: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from', label: ReactNode, disabled?: boolean
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  amountType: AmountType, codeType: CodeType, distributionMethod: DistributionMethod
}) => {
  const key = type === 'overall' ? 'overallMaxNumTransfers' : type === 'to' ? 'perToAddressMaxNumTransfers' : type === 'initiatedBy' ? 'perInitiatedByAddressMaxNumTransfers' : 'perFromAddressMaxNumTransfers';
  const numUses = approvalToAdd?.approvalCriteria?.maxNumTransfers?.[key] || 0n;
  const setNumUses = (numUses: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        maxNumTransfers: {
          ...approvalToAdd.approvalCriteria.maxNumTransfers,
          [key]: numUses,
        }
      }
    });
  }

  const trackedBehindTheScenes =
    (key === 'overallMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) ||
    (key === 'perFromAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n) ||
    (key === 'perInitiatedByAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n) ||
    (key === 'perToAddressMaxNumTransfers' && amountType === AmountType.Predetermined && approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers && approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n)

  return <> <TableRow labelSpan={16} valueSpan={8} label={<>
    {label} <Tooltip color='black' title="Max uses = the maximum number of times this approval can be used.">
      <InfoCircleOutlined />
    </Tooltip>

  </>} value={<>
    <Switch
      checked={numUses > 0n}
      onChange={(checked) => {
        setNumUses(checked ? 1n : 0n);
      }}
      disabled={disabled}
    />
  </>
  } />
    {trackedBehindTheScenes && <div style={{ marginLeft: 10, textAlign: 'start' }}>
      <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> Even if no max is set, this value is tracked behind the scenes (due to the selected method of assigning partitions).
      </Typography.Text>
      <br /><br />
    </div>}
    {numUses > 0n && <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
      <NumberInput
        title='Max Uses'
        value={Number(numUses)}
        disabled={disabled}
        setValue={(val) => {
          setNumUses(BigInt(val));
        }}
        min={1}
        max={100000}
      />
      <br />
      {disabled && <div style={{ marginLeft: 10 }}>

        <LockOutlined /> {type === 'overall' ? 'To edit this, edit the number of ' + (codeType === CodeType.Unique ? 'codes.' : 'password uses.') : ''}
        {type !== 'overall' && <>
          Locked due to distribution method: {distributionMethod === DistributionMethod.Codes ?
            codeType === CodeType.Unique ? 'Codes' : 'Password' : distributionMethod}
        </>}
      </div>}

    </div>}
  </>
}

const ApprovalAmounts = ({ label, disabled, type, approvalToAdd, setApprovalToAdd, collectionId }: {
  type: 'overall' | 'to' | 'initiatedBy' | 'from', label: ReactNode, disabled?: boolean,
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  collectionId: bigint
}) => {
  const key = type === 'overall' ? 'overallApprovalAmount' : type === 'to' ? 'perToAddressApprovalAmount' : type === 'initiatedBy' ? 'perInitiatedByAddressApprovalAmount' : 'perFromAddressApprovalAmount';
  const approvedAmount = approvalToAdd?.approvalCriteria?.approvalAmounts?.[key] || 0n;
  const setApprovedAmount = (approvedAmount: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        approvalAmounts: {
          ...approvalToAdd.approvalCriteria.approvalAmounts,
          [key]: approvedAmount,
        }
      }
    });
  }

  return <> <TableRow labelSpan={16} valueSpan={8} label={label} value={<>
    <Switch
      checked={approvedAmount > 0n}
      onChange={(checked) => {
        setApprovedAmount(checked ? 1n : 0n);
      }}
      disabled={disabled}
    />

  </>
  } />
    {approvedAmount > 0n && <div style={{ justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
      <NumberInput

        title='Max Amount Approved'
        value={Number(approvedAmount)}
        disabled={disabled}
        setValue={(val) => {
          setApprovedAmount(BigInt(val));
        }}
        min={1}
        max={100000}
      />
      <BalanceDisplay
        hideBadges

        hideMessage collectionId={collectionId}
        balances={[{ amount: approvedAmount, badgeIds: approvalToAdd.badgeIds, ownershipTimes: approvalToAdd.ownershipTimes }]} />
    </div>}
  </>
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

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));

  const defaultApprovalToAdd: CollectionApprovalWithDetails<bigint> & { approvalCriteria: Required<ApprovalCriteriaWithDetails<bigint>> } = {
    fromMappingId: defaultFromMapping ? defaultFromMapping.mappingId : 'Mint',
    fromMapping: defaultFromMapping ? defaultFromMapping : getReservedAddressMapping("Mint"),
    toMappingId: defaultToMapping ? defaultToMapping.mappingId : 'AllWithoutMint',
    toMapping: defaultToMapping ? defaultToMapping : getReservedAddressMapping("AllWithoutMint"),
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
  const setNumRecipients = (numRecipients: bigint) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        maxNumTransfers: {
          ...approvalToAdd.approvalCriteria.maxNumTransfers,
          overallMaxNumTransfers: numRecipients,
        }
      }
    });
  }
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
          }
        }
      }
    });
  }, [amountType, approvalToAdd.badgeIds]);

  const PasswordSelect = <div style={{ textAlign: 'center' }}>
    <NumberInput
      title="Number of Uses"
      value={Number(numRecipients)}
      setValue={(val) => setNumRecipients(BigInt(val))}
      min={1}
      max={100000}
    />
    <br />
    <b style={{ textAlign: 'center' }}>Password</b>
    <Input
      value={claimPassword}
      onChange={(e) => {
        setClaimPassword?.(e.target.value);
      }}
      className='primary-text inherit-bg'
    />
    {!claimPassword && <div style={{ color: 'red' }}>Password cannot be empty.</div>}
  </div>

  const LearnMore = <div style={{ textAlign: 'center' }} className='secondary-text'>
    <br />
    <p>
      <InfoCircleOutlined /> Note that this is a centralized solution. <Tooltip color='black' title="For a better user experience, codes and passwords are stored in a centralized manner via the BitBadges servers. This makes it easier for you (the collection creator) by eliminating storage requirements. For a decentralized solution, you can store your own codes and interact directly with the blockchain (see documentation).">
        Hover to learn more.
      </Tooltip>
    </p>
  </div>

  return <>
    <Typography.Text style={{ textAlign: 'center' }} className="secondary-text">
      <WarningOutlined style={{ marginRight: 5, color: 'orange' }} />
      Approvals determine the rules for transferring badges but do not execute the actual badge distribution.
      Approvals can be created that do not align with the current balances of the sender (e.g. accounting for future badges).
      However, successful transfers must always meet two conditions: a valid approval and sufficient balances.
    </Typography.Text>
    <br /><br />
    <Row style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='primary-text'>
      <InformationDisplayCard title='Who?' md={24} xs={24} sm={24} subtitle='Who is approved to send, receive, and initiate the transfers?'>
        <hr />
        <div className='flex flex-wrap'>
          <InformationDisplayCard noBorder inheritBg title={<>From <LockOutlined /></>} md={8} xs={24} sm={24} subtitle='Who can send the badges?'>
            <AddressMappingSelectComponent
              approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
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
            <TableRow labelSpan={16} valueSpan={8} label={'Sender must be initiator?'} value={<Switch
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
            <TableRow labelSpan={16} valueSpan={8} label={'Sender must not be initiator?'} value={<Switch
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

            {requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy && <div style={{ color: 'red' }}>Sender cannot be both initiator and not initiator.</div>}

            <MaxUses
              approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
              label={'Max uses per sender'} type='from' disabled />
            {isInAddressMapping(approvalToAdd.fromMapping, "Mint") && nonMintOnlyApproval &&
              <div style={{ color: 'red' }}>
                <WarningOutlined /> Please remove the Mint address from the list of possible senders.
              </div>}

          </InformationDisplayCard>
          <InformationDisplayCard noBorder inheritBg title='To' md={8} xs={24} sm={24} subtitle='Who can receive the badges?'>
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
            <TableRow labelSpan={16} valueSpan={8} label={'Recipient must be initiator?'} value={<Switch
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
            <TableRow labelSpan={16} valueSpan={8} label={'Recipient must not be initiator?'} value={<Switch
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
            {requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy && <div style={{ color: 'red' }}>Recipient cannot be both initiator and not initiator.</div>}
            {requireFromEqualsInitiatedBy && requireToEqualsInitiatedBy && <div style={{ color: 'red' }}>Recipient cannot be sender, recipient, and initiator.</div>}
            <MaxUses disabled={toMappingLocked} approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per recipient'} type='to' />

          </InformationDisplayCard>
          <InformationDisplayCard noBorder inheritBg title='Initiated By' md={8} xs={24} sm={24} subtitle='Who is approved to initiate the transfer?'>
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

                  {distributionMethod === DistributionMethod.Whitelist && <div className='' style={{ textAlign: 'start' }}>

                    <Typography.Text strong className='secondary-text' style={{ fontSize: 12 }}>
                      <InfoCircleOutlined /> Incompatible with off-chain whitelists.
                    </Typography.Text>
                  </div>}
                </>
              } value={<>
                <div>
                  <Switch
                    disabled={distributionMethod === DistributionMethod.Whitelist}
                    checked={distributionMethod === DistributionMethod.Codes}
                    onChange={(checked) => {
                      if (checked) {
                        setDistributionMethod(DistributionMethod.Codes);
                        setApprovalToAdd({
                          ...approvalToAdd,
                          approvalCriteria: {
                            ...approvalToAdd.approvalCriteria,
                            maxNumTransfers: {
                              ...approvalToAdd.approvalCriteria.maxNumTransfers,
                              overallMaxNumTransfers: 1n,
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


            {distributionMethod === DistributionMethod.Codes && <>
              {distributionMethod === DistributionMethod.Codes && LearnMore}
              <SwitchForm
                fullWidthCards
                options={[{
                  title: 'Unique Codes',
                  message: 'Codes will be uniquely generated and one-time use only. You can distribute these codes how you would like.',
                  isSelected: codeType === CodeType.Unique,
                  additionalNode: <NumberInput
                    title="Number of Codes"
                    value={Number(numRecipients)}
                    setValue={(val) => setNumRecipients(BigInt(val))}
                    min={1}
                    max={100000}
                  />,
                },
                {
                  title: 'Password',
                  message: `You enter a custom password that is to be used by all claimees (e.g. attendance code). Limited to one use per address.`,
                  isSelected: codeType === CodeType.Reusable,
                  additionalNode: PasswordSelect,
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
            <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses (all cumulatively)'} type='overall' disabled={distributionMethod === DistributionMethod.Codes || initiatedByMappingLocked} />
            <MaxUses approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod} label={'Max uses per initiator'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable || initiatedByMappingLocked} />
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
              <InformationDisplayCard noBorder inheritBg
                title={''}
                subtitle={'Select badges that the initiator must own (or not own) at the time of transfer. Only works for badges with on-chain balances.'}
                span={24}
              >
                <div className='primary-text'>
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

          </InformationDisplayCard></div>
      </InformationDisplayCard>
      <InformationDisplayCard md={24} xs={24} sm={24} title='Amounts' subtitle='Which and how many badges are approved to be transferred?'>
        <hr />
        <br />

        <div className='flex flex-wrap'>
          <InformationDisplayCard noBorder inheritBg title='Badge IDs' md={8} xs={24} sm={24} subtitle='Which badges are approved to be transferred?'>
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

          <InformationDisplayCard noBorder inheritBg md={8} xs={24} sm={24} title='Ownership Times' subtitle='Which ownership times for the badges are approved to be transferred?'>
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
          <InformationDisplayCard noBorder inheritBg md={8} xs={24} sm={24} title='Amounts' subtitle='Select the amounts to approve.'>
            {(approvalToAdd.badgeIds.length === 0 || approvalToAdd.ownershipTimes.length === 0) && <div style={{ color: 'red' }}>
              <WarningOutlined /> Badge IDs and / or ownership times cannot be empty.
            </div>}
            {approvalToAdd.badgeIds.length > 0 && approvalToAdd.ownershipTimes.length > 0 && <div className='flex-center'>

              <Col >

                {showMintingOnlyFeatures && <>    <br />            <b style={{ fontSize: 14 }}> Select Type</b><br />
                  <Radio.Group buttonStyle='solid' value={amountType} onChange={(e) => {
                    setAmountType(e.target.value);

                  }}>
                    <Radio.Button value={AmountType.Tally}>Standard</Radio.Button>
                    <Radio.Button value={AmountType.Predetermined}>Dynamic</Radio.Button>
                  </Radio.Group></>
                }

                {amountType === AmountType.Tally && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='secondary-text'>
                    <div className=''>
                      <InfoCircleOutlined /> Standard - Approvals will correspond to the selected badge IDs ({getBadgeIdsString(approvalToAdd.badgeIds)}) and times ({getTimeRangesElement(approvalToAdd.ownershipTimes)}).
                      You can set the limit for the amount approved on an overall (all users), per recipient, per sender, and / or per initiator basis.
                    </div>
                  </div>
                  <br />
                  {amountType === AmountType.Tally && <>
                    <ApprovalAmounts
                      approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId}
                      type='overall' label='Overall (all users)' />
                    <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='from' label='Per sender' />
                    <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='to' label='Per recipient' />
                    <ApprovalAmounts approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} type='initiatedBy' label='Per initiator' />

                    {!approvalHasApprovalAmounts(approvalToAdd.approvalCriteria.approvalAmounts) && <div style={{ textAlign: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <WarningOutlined style={{ color: 'orange' }} />
                        <span style={{ marginLeft: 8, color: 'orange' }}>
                          Without any selections, there will be no amount restrictions (unlimited quantity approved).
                        </span>
                      </div>
                    </div>}
                  </>}
                </>}
                {amountType === AmountType.Predetermined && <>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }} className='secondary-text'>
                    <div className=''>
                      <InfoCircleOutlined /> Dynamic - We will split the badge IDs into N partitions (with the selected badge IDs as partition #1).
                      For each approval, we will calculate which partition of badge IDs to approve dynamically.
                    </div>
                  </div>

                  <br />
                  <hr />
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
                    keyId='usePerInitiatedByAddressNumTransfers' label='Increment per unique initiated by address?' />
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
                </>
                }
              </Col>
            </div>}
          </InformationDisplayCard>
        </div>

      </InformationDisplayCard >
      <InformationDisplayCard title='Logistics' md={24} xs={24} sm={24} subtitle='Provide additional details for the approval.'>
        <hr />
        <div className='flex flex-wrap'>
          <InformationDisplayCard noBorder inheritBg title='Transfer Times' md={8} xs={24} sm={24} subtitle='When is this approval valid?'>
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
          <InformationDisplayCard noBorder inheritBg title='Approval Info' md={8} xs={24} sm={24} subtitle=''>
            <ClaimMetadataSelect approvalDetails={approvalToAdd.details} setApprovalDetails={(details) => {
              setApprovalToAdd({
                ...approvalToAdd,
                details,
              });
            }} />

          </InformationDisplayCard>
          <InformationDisplayCard noBorder inheritBg title='Start Point' md={8} xs={24} sm={24} subtitle='Decide to start from  scratch or from a prior approval.'>
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
                    className='primary-text'
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
                  className='primary-text inherit-bg'
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
                  className='primary-text inherit-bg'
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
                  className='primary-text inherit-bg'
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
              <div style={{ textAlign: 'center' }}>
                <br />
                <span style={{ marginLeft: 8 }}>
                  <InfoCircleOutlined /> Editing IDs is advanced and not recommended. Learn more <a href='https://docs.bitbadges.io/for-developers/concepts/approval-criteria' target='_blank'>here</a>.
                </span>
              </div>
            </div>}
          </InformationDisplayCard >
        </div>
      </InformationDisplayCard>
    </Row >
    {/* <br />
    <div className='full-width'>
      <Divider />
      <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
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
          const toAddresses = approvalToAdd.toMapping.addresses;
          newApprovalToAdd.initiatedByMapping = getReservedAddressMapping("AllWithMint");
          newApprovalToAdd.initiatedByMappingId = "AllWithMint";

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