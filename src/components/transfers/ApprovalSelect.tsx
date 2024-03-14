import { InfoCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Row, Switch, Typography } from 'antd';
import {
  AddressList,
  ApprovalInfoDetails,
  BalanceArray,
  ClaimIntegrationPluginType,
  CollectionApprovalPermissionWithDetails,
  CollectionApprovalWithDetails,
  MerkleChallengeWithDetails,
  MustOwnBadges,
  TransferWithIncrements,
  UintRangeArray,
  convertToCosmosAddress,
  deepCopyPrimitives,
  getAllBadgeIdsToBeTransferred,
  iApprovalCriteriaWithDetails,
  iApprovalInfoDetails,
  iCollectionApprovalWithDetails,
  iUintRange,
  validateCollectionApprovalsUpdate
} from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DistributionMethod } from '../../bitbadges-api/types';
import { approvalCriteriaUsesPredeterminedBalances } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { IntegrationPluginDetails, getBlankPlugin, getPlugin, getPluginDetails } from '../../integrations/integrations';
import { BitBadgesClaimLogo } from '../../pages/lists/[listId]';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { BalanceInput } from '../balances/BalanceInput';
import { generateCodesFromSeed } from '../collection-page/transferability/OffChainTransferabilityTab';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { BadgeIDSelectWithSwitch } from '../inputs/BadgeIdRangesInput';
import { DateSelectWithSwitch } from '../inputs/DateRangeInput';
import { Tabs } from '../navigation/Tabs';
import { AddressListSelectComponent } from './ApprovalSelectHelpers/AddressListsSelectComponent';
import { ApprovalSelectAmountsCard } from './ApprovalSelectHelpers/ApprovalAmountsCard';
import { ApprovalTemplates } from './ApprovalSelectHelpers/ApprovalTemplates';
import { ClaimBuilder } from './ClaimBuilder';
import { ClaimMetadataSelect } from './ClaimMetadataSelectStep';

const crypto = require('crypto');

export enum DistributionType {
  None,
  Manual,
  Builder
}

export enum PredeterminedTab {
  Tally,
  AllOrNothing,
  NoLimit
}

export type RequiredApprovalProps = iCollectionApprovalWithDetails<bigint> & {
  approvalCriteria: Required<iApprovalCriteriaWithDetails<bigint>>;
  details: iApprovalInfoDetails<bigint>;
};

//Get minimum value but ignore 0 values
const minNonZeroValue = (values: bigint[]) => {
  let min = GO_MAX_UINT_64;
  for (const value of values) {
    if (value > 0n && value < min) {
      min = value;
    }
  }
  return min;
};

//Gets the max increments applied to the approval
//Basicallly, it is the minimum value set for overall max uses and the selected usePer max uses (where applicable)
export const getMaxTransfersApplied = (approvalToAdd: RequiredApprovalProps) => {
  const checkedKeyId = Object.entries(approvalToAdd.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).find(
    ([, val]) => val === true
  )?.[0];
  let maxIncrementsApplied = 0n;
  if (checkedKeyId === 'useOverallNumTransfers' || checkedKeyId === 'useMerkleChallengeLeafIndex' || !checkedKeyId) {
    maxIncrementsApplied = approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers;
  } else if (checkedKeyId === 'usePerFromAddressNumTransfers') {
    // If requireFromEqualsInitiatedBy is true, then use perInitiatedByAddressMaxNumTransfers
    maxIncrementsApplied = minNonZeroValue([
      approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers,
      approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy
        ? approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers
        : approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers
    ]);
  } else if (checkedKeyId === 'usePerInitiatedByAddressNumTransfers') {
    maxIncrementsApplied = minNonZeroValue([
      approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers,
      approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers
    ]);
  } else if (checkedKeyId === 'usePerToAddressNumTransfers') {
    maxIncrementsApplied = minNonZeroValue([
      approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers,
      approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy
        ? approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers
        : approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers
    ]);
  }

  return maxIncrementsApplied;
};

export function ApprovalSelect({
  collectionId,
  setVisible,
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
  defaultFromList?: AddressList;
  defaultToList?: AddressList;
  defaultInitiatedByList?: AddressList;
  toListLocked?: boolean;
  initiatedByListLocked?: boolean;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  hideRemaining?: boolean;
  setVisible?: (visible: boolean) => void;
  defaultApproval?: CollectionApprovalWithDetails<bigint>;
  showMintingOnlyFeatures?: boolean;
  approvalsToAdd: Array<CollectionApprovalWithDetails<bigint>>;
  setApprovalsToAdd: (approvalsToAdd: Array<CollectionApprovalWithDetails<bigint>>) => void;
  hideCollectionOnlyFeatures?: boolean;
  startingApprovals: Array<CollectionApprovalWithDetails<bigint>>;
  approvalPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>;
}) {
  const isEdit = !!defaultApproval;
  const nonMintOnlyApproval = defaultFromList?.listId === '!Mint';
  const mintOnlyApproval = defaultFromList?.listId === 'Mint' && fromListLocked;

  const hybridWhitelistClaim = defaultApproval?.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf;
  const hybridWhitelistedAddresses = defaultApproval?.details?.challengeDetails?.leavesDetails.leaves || [];
  defaultApproval = defaultApproval?.clone();
  if (defaultApproval && hybridWhitelistClaim && hybridWhitelistedAddresses.length > 0) {
    defaultApproval.initiatedByList.addresses = hybridWhitelistedAddresses;
    defaultApproval.initiatedByList.whitelist = true;
  }

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));
  const claimId = useRef(crypto.randomBytes(32).toString('hex'));
  const defaultApprovalToAdd: iCollectionApprovalWithDetails<bigint> & {
    approvalCriteria: Required<iApprovalCriteriaWithDetails<bigint>>;
    details: iApprovalInfoDetails<bigint>;
  } = {
    fromListId: defaultFromList ? defaultFromList.listId : 'Mint',
    fromList: defaultFromList ? defaultFromList : AddressList.getReservedAddressList('Mint'),
    toListId: defaultToList ? defaultToList.listId : 'All',
    toList: defaultToList ? defaultToList : AddressList.AllAddresses(),
    initiatedByListId: defaultInitiatedByList ? defaultInitiatedByList.listId : 'All',
    initiatedByList: defaultInitiatedByList ? defaultInitiatedByList : AddressList.AllAddresses(),
    transferTimes: UintRangeArray.FullRanges(),
    ownershipTimes: UintRangeArray.FullRanges(),
    badgeIds: [],
    approvalId: '',
    amountTrackerId: '',
    challengeTrackerId: '',

    ...defaultApproval,

    details: {
      name: '',
      description: '',
      challengeDetails: {
        leavesDetails: {
          leaves: [],
          isHashed: false
        }
      },
      ...defaultApproval?.details
    },
    approvalCriteria: {
      mustOwnBadges: [],
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n
      },
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [],
          incrementBadgeIdsBy: 0n,
          incrementOwnershipTimesBy: 0n
        },
        orderCalculationMethod: {
          useMerkleChallengeLeafIndex: false,
          useOverallNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          usePerToAddressNumTransfers: false
        }
      },
      merkleChallenge: {
        root: '',
        expectedProofLength: 0n,

        useCreatorAddressAsLeaf: false,
        maxUsesPerLeaf: 1n,
        uri: '',
        customData: ''
      }, //handled later
      requireToEqualsInitiatedBy: true,
      requireFromEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,

      overridesToIncomingApprovals: false,
      overridesFromOutgoingApprovals: defaultFromList?.listId === 'Mint' ? true : false,

      ...defaultApproval?.approvalCriteria
    }
  };

  const [approvalToAdd, setApprovalToAdd] = useState<RequiredApprovalProps>(deepCopyPrimitives(defaultApprovalToAdd));

  const approvalCriteria = approvalToAdd.approvalCriteria;
  const numRecipients = approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers || 0n;

  const mustOwnBadges = approvalCriteria?.mustOwnBadges || [];
  const setMustOwnBadges = (mustOwnBadges: Array<MustOwnBadges<bigint>>) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        mustOwnBadges: mustOwnBadges
      }
    });
  };

  const requireToEqualsInitiatedBy = approvalCriteria?.requireToEqualsInitiatedBy || false;
  const requireToDoesNotEqualInitiatedBy = approvalCriteria?.requireToDoesNotEqualInitiatedBy || false;
  const requireFromEqualsInitiatedBy = approvalCriteria?.requireFromEqualsInitiatedBy || false;
  const requireFromDoesNotEqualInitiatedBy = approvalCriteria?.requireFromDoesNotEqualInitiatedBy || false;

  const startBalances = approvalCriteria.predeterminedBalances?.incrementedBalances?.startBalances || [];
  const defaultClaim = defaultApprovalToAdd?.details?.offChainClaims?.[0] ?? undefined;

  const uintRangesOverlap = UintRangeArray.From(approvalToAdd?.badgeIds).hasOverlaps();
  const uintRangesLengthEqualsZero = approvalToAdd?.badgeIds.length === 0;

  const ownedTimesOverlap = UintRangeArray.From(approvalToAdd?.ownershipTimes).hasOverlaps();
  const ownedTimesLengthEqualsZero = approvalToAdd?.ownershipTimes.length === 0;

  const transferTimesOverlap = UintRangeArray.From(approvalToAdd?.transferTimes).hasOverlaps();
  const transferTimesLengthEqualsZero = approvalToAdd?.transferTimes.length === 0;

  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(
    defaultClaim
      ? DistributionMethod.Claims
      : hybridWhitelistClaim && hybridWhitelistedAddresses.length > 0
        ? DistributionMethod.Whitelist
        : DistributionMethod.None
  );

  const [showMustOwnBadges, setShowMustOwnBadges] = useState(approvalCriteria?.mustOwnBadges?.length > 0);

  const [plugins, setPlugins] = useState<IntegrationPluginDetails<ClaimIntegrationPluginType>[]>(defaultClaim?.plugins || []);
  const [disabled, setDisabled] = useState(false);

  const [amountsTab, setAmountsTab] = useState<PredeterminedTab>(
    approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria) ? PredeterminedTab.AllOrNothing : PredeterminedTab.Tally
  );

  const increment = approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy;
  const hasIncrements = increment > 0n;
  const toUsePredeterminedBalances =
    hasIncrements || distributionMethod === DistributionMethod.Claims || amountsTab === PredeterminedTab.AllOrNothing;

  const setAmountProperties = useCallback(
    (props: {
      distributionMethod?: DistributionMethod;
      badgeIds?: iUintRange<bigint>[];
      ownershipTimes?: iUintRange<bigint>[];
      increment?: bigint;
      numIncrements?: bigint;
      amountsTab?: PredeterminedTab;
    }) => {
      const distributionMethodVal = props.distributionMethod || distributionMethod;
      const amountsTabVal = props.amountsTab || amountsTab;

      //If we have increments (and using whitelist / no dist method) or if we are using claims (with a code based system, we shouldn't allow tallies)

      setApprovalToAdd((approvalToAdd) => {
        console.log(props);
        const badgeIds =
          props.badgeIds ??
          (approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length > 0
            ? approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].badgeIds
            : approvalToAdd.badgeIds);

        const ownershipTimes = props.ownershipTimes ?? approvalToAdd.ownershipTimes;
        const increment = props.increment ?? approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy;
        const numIncrements = props.numIncrements ?? getMaxTransfersApplied(approvalToAdd) - 1n;
        const numTransfers = numIncrements + 1n;

        const hasIncrements = increment > 0n;
        const toUsePredeterminedBalances =
          hasIncrements || distributionMethodVal === DistributionMethod.Claims || amountsTabVal === PredeterminedTab.AllOrNothing;

        if (toUsePredeterminedBalances) {
          const allApprovedBadges =
            numTransfers > 0n
              ? getAllBadgeIdsToBeTransferred([
                  new TransferWithIncrements({
                    from: '',
                    balances: [
                      {
                        badgeIds: UintRangeArray.From(badgeIds),
                        ownershipTimes: [...ownershipTimes],
                        amount: 1n
                      }
                    ],
                    toAddressesLength: numTransfers,
                    toAddresses: [],
                    incrementBadgeIdsBy: increment,
                    incrementOwnershipTimesBy: 0n
                  })
                ])
              : badgeIds;

          return {
            ...approvalToAdd,
            badgeIds: allApprovedBadges,
            ownershipTimes: ownershipTimes,
            approvalCriteria: {
              ...approvalToAdd.approvalCriteria,
              approvalAmounts: {
                overallApprovalAmount: 0n,
                perFromAddressApprovalAmount: 0n,
                perToAddressApprovalAmount: 0n,
                perInitiatedByAddressApprovalAmount: 0n
              },
              predeterminedBalances: {
                ...approvalToAdd.approvalCriteria.predeterminedBalances,
                manualBalances: [],
                incrementedBalances: {
                  ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                  startBalances: [
                    {
                      badgeIds: badgeIds,
                      ownershipTimes: ownershipTimes,
                      amount: approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0]?.amount || 1n
                    }
                  ],
                  incrementBadgeIdsBy: increment,
                  incrementOwnershipTimesBy: 0n
                }
              }
            }
          };
        } else {
          return {
            ...approvalToAdd,
            badgeIds: badgeIds,
            ownershipTimes: ownershipTimes,
            approvalCriteria: {
              ...approvalToAdd.approvalCriteria,
              predeterminedBalances: {
                ...approvalToAdd.approvalCriteria.predeterminedBalances,
                manualBalances: [],
                incrementedBalances: {
                  ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                  startBalances: [],
                  incrementBadgeIdsBy: 0n,
                  incrementOwnershipTimesBy: 0n,
                  orderCalculationMethod: {
                    useMerkleChallengeLeafIndex: false,
                    useOverallNumTransfers: false,
                    usePerFromAddressNumTransfers: false,
                    usePerInitiatedByAddressNumTransfers: false,
                    usePerToAddressNumTransfers: false
                  }
                }
              }
            }
          };
        }
      });
    },
    [distributionMethod, amountsTab]
  );

  const setOwnershipTimes = (ownershipTimes: iUintRange<bigint>[]) => {
    setAmountProperties({
      ownershipTimes
    });
  };

  const setAmountsTabAndReset = (tab: PredeterminedTab) => {
    setAmountProperties({
      amountsTab: tab
    });
    setAmountsTab(tab);
  };

  const setDistributionMethodAndReset = (distributionMethod: DistributionMethod) => {
    setDistributionMethod(distributionMethod);
    setMaxUses(1n, 'overall');
    setMaxUses(1n, 'initiatedBy');
    setAmountProperties({
      distributionMethod
    });
    setAmountsTab(PredeterminedTab.AllOrNothing);

    if (distributionMethod === DistributionMethod.Claims) {
      setPlugins([
        {
          id: 'numUses',
          publicParams: {
            maxUses: 1,
            maxUsesPerAddress: 1,
            assignMethod: 'firstComeFirstServe'
          },
          privateParams: getPlugin('numUses').getBlankPrivateParams(),
          publicState: getPlugin('numUses').getBlankPublicState()
        }
      ]);
    } else {
      setPlugins([]);
    }
  };

  const getKeyFromType = (type: 'overall' | 'to' | 'initiatedBy' | 'from') => {
    return type === 'overall'
      ? 'overallMaxNumTransfers'
      : type === 'to'
        ? 'perToAddressMaxNumTransfers'
        : type === 'initiatedBy'
          ? 'perInitiatedByAddressMaxNumTransfers'
          : 'perFromAddressMaxNumTransfers';
  };

  const setMaxUses = useCallback(
    (maxUses: bigint, type: 'overall' | 'to' | 'initiatedBy' | 'from') => {
      const key = getKeyFromType(type);

      setApprovalToAdd((approvalToAdd) => {
        return {
          ...approvalToAdd,
          approvalCriteria: {
            ...approvalToAdd.approvalCriteria,
            maxNumTransfers: {
              ...approvalToAdd.approvalCriteria.maxNumTransfers,
              [key]: maxUses
            }
          }
        };
      });
    },
    [setApprovalToAdd]
  );
  console.log(startBalances);

  const getAmountKeyFromType = (type: 'overall' | 'to' | 'initiatedBy' | 'from') => {
    return type === 'overall'
      ? 'overallApprovalAmount'
      : type === 'to'
        ? 'perToAddressApprovalAmount'
        : type === 'initiatedBy'
          ? 'perInitiatedByAddressApprovalAmount'
          : 'perFromAddressApprovalAmount';
  };

  const setAmount = useCallback(
    (amount: bigint, type: 'overall' | 'to' | 'initiatedBy' | 'from') => {
      const key = getAmountKeyFromType(type);
      setApprovalToAdd((approvalToAdd) => {
        return {
          ...approvalToAdd,
          approvalCriteria: {
            ...approvalToAdd.approvalCriteria,
            approvalAmounts: {
              ...approvalToAdd.approvalCriteria.approvalAmounts,
              [key]: amount
            }
          }
        };
      });
    },
    [setApprovalToAdd]
  );

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('whitelist');
    const whitelistSize = approvalToAdd.initiatedByList.addresses.length;

    //If we were previously a whitelist and now we are not, we need to remove the distribution method
    if (!approvalToAdd.initiatedByList.whitelist && distributionMethod === DistributionMethod.Whitelist) {
      setDistributionMethod(DistributionMethod.None);
    }

    //If we are a whitelist, we need to set the max uses and approved amounts accordingly
    //If there is only one address, we can set the max uses and approved amounts to 0 (we use the overall amounts instead)
    if (distributionMethod === DistributionMethod.Whitelist && approvalToAdd.initiatedByList.whitelist) {
      setMaxUses(BigInt(whitelistSize), 'overall');
      setMaxUses(0n, 'initiatedBy');
      setAmount(0n, 'initiatedBy');
    } else if (whitelistSize == 1 && approvalToAdd.initiatedByList.whitelist) {
      setMaxUses(0n, 'initiatedBy');
      setAmount(0n, 'initiatedBy');
    }

    //If we only have one, we use the overall
    //If we require the recipient to equal the initiated by, we use the initiated by
    const toSize = approvalToAdd.toList.addresses.length;
    if ((toSize == 1 && approvalToAdd.toList.whitelist) || approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy) {
      setMaxUses(0n, 'to');
      setAmount(0n, 'to');

      if (approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy && approvalToAdd.toList.listId !== 'All') {
        setApprovalToAdd((approvalToAdd) => {
          return {
            ...approvalToAdd,
            toList: AddressList.AllAddresses(),
            toListId: 'All'
          };
        });
      }
    }

    //If we only have one, we use the overall
    //If we require the from to equal the initiated by, we use the initiated by
    const fromSize = approvalToAdd.fromList.addresses.length;
    if ((fromSize == 1 && approvalToAdd.fromList.whitelist) || approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy) {
      setMaxUses(0n, 'from');
      setAmount(0n, 'from');

      if (approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy && approvalToAdd.fromList.listId !== 'All') {
        setApprovalToAdd((approvalToAdd) => {
          return {
            ...approvalToAdd,
            fromList: AddressList.AllAddresses(),
            fromListId: 'All'
          };
        });
      }
    }

    if (distributionMethod === DistributionMethod.Claims) {
      if (approvalToAdd.initiatedByList.listId != 'All') {
        setApprovalToAdd((approvalToAdd) => {
          return {
            ...approvalToAdd,
            initiatedByList: AddressList.AllAddresses(),
            initiatedByListId: 'All'
          };
        });
      }

      if (approvalToAdd.approvalCriteria.mustOwnBadges.length > 0) {
        setApprovalToAdd((approvalToAdd) => {
          return {
            ...approvalToAdd,
            approvalCriteria: {
              ...approvalToAdd.approvalCriteria,
              mustOwnBadges: []
            }
          };
        });
      }
    }
  }, [
    distributionMethod,
    approvalToAdd.approvalCriteria.requireFromEqualsInitiatedBy,
    approvalToAdd.approvalCriteria.requireToEqualsInitiatedBy,
    approvalToAdd.fromList,
    approvalToAdd.initiatedByList,
    approvalToAdd.toList,
    approvalToAdd.approvalCriteria.mustOwnBadges,
    setDistributionMethod,
    setMaxUses,
    setAmount
  ]);

  let isFormDisabled = false;
  isFormDisabled = isFormDisabled || (approvalToAdd.approvalCriteria.mustOwnBadges.length > 0 && !showMustOwnBadges);
  isFormDisabled = isFormDisabled || (distributionMethod === DistributionMethod.Claims && disabled);
  isFormDisabled = isFormDisabled || new AddressList(approvalToAdd.fromList).isEmpty();
  isFormDisabled = isFormDisabled || new AddressList(approvalToAdd.toList).isEmpty();
  isFormDisabled = isFormDisabled || new AddressList(approvalToAdd.initiatedByList).isEmpty();
  isFormDisabled = isFormDisabled || approvalToAdd.badgeIds.length === 0;
  isFormDisabled = isFormDisabled || approvalToAdd.ownershipTimes.length === 0;
  isFormDisabled = isFormDisabled || approvalToAdd.transferTimes.length === 0;
  isFormDisabled = isFormDisabled || uintRangesOverlap;
  isFormDisabled = isFormDisabled || uintRangesLengthEqualsZero;
  isFormDisabled = isFormDisabled || ownedTimesOverlap;
  isFormDisabled = isFormDisabled || ownedTimesLengthEqualsZero;
  isFormDisabled = isFormDisabled || (requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy);
  isFormDisabled = isFormDisabled || (requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy);
  isFormDisabled =
    isFormDisabled ||
    !!approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.find(
      (x) =>
        x.amount <= 0n ||
        UintRangeArray.From(x.badgeIds).hasOverlaps() ||
        UintRangeArray.From(x.ownershipTimes).hasOverlaps() ||
        x.badgeIds.length === 0 ||
        x.ownershipTimes.length === 0
    );
  isFormDisabled = isFormDisabled || (nonMintOnlyApproval && new AddressList(approvalToAdd.fromList).checkAddress('Mint'));
  isFormDisabled = isFormDisabled || (!!approvalsToAdd.find((x) => x.approvalId === approvalToAdd.approvalId) && !defaultApproval);
  isFormDisabled = isFormDisabled || (nonMintOnlyApproval && new AddressList(approvalToAdd.fromList).checkAddress('Mint'));
  isFormDisabled = isFormDisabled || transferTimesOverlap;
  isFormDisabled = isFormDisabled || transferTimesLengthEqualsZero;
  isFormDisabled = isFormDisabled || (startBalances.length > 0 && startBalances.some((x) => x.amount <= 0n));
  isFormDisabled = isFormDisabled || (distributionMethod === DistributionMethod.Claims && plugins.length === 0);
  isFormDisabled =
    isFormDisabled ||
    (toUsePredeterminedBalances &&
      increment > 0 &&
      getMaxTransfersApplied(approvalToAdd) !== getExpectedNumTransfers(approvalToAdd, distributionMethod));
  isFormDisabled = isFormDisabled || (toUsePredeterminedBalances && startBalances.length > 0 && startBalances.some((x) => x.amount <= 0n));
  isFormDisabled =
    isFormDisabled ||
    (toUsePredeterminedBalances && approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length === 0);

  return (
    <>
      <Typography.Text style={{ textAlign: 'center' }} className="secondary-text">
        <WarningOutlined style={{ marginRight: 5, color: '#FF5733' }} />
        Below, you are creating an approval. Approvals determine the rules for how badges can be transferred but do not actually transfer the badges.
        For any transfer to be successful, there must be a valid approval and sufficient balances.
      </Typography.Text>
      <br />
      <br />
      {mintOnlyApproval && (
        <ApprovalTemplates defaultApprovalToAdd={defaultApprovalToAdd} setApprovalToAdd={setApprovalToAdd} collectionId={collectionId} />
      )}

      <div className="flex flex-wrap full-width">
        <InformationDisplayCard
          title="Approval Details"
          md={16}
          xs={24}
          sm={24}
          subtitle="Provide optional metadata for the approval. Explain what it is for, how to get approved, etc. This will be displayed alongside the approval.">
          <ClaimMetadataSelect
            approvalDetails={new ApprovalInfoDetails(approvalToAdd.details)}
            setApprovalDetails={(details) => {
              setApprovalToAdd({
                ...approvalToAdd,
                details: details
              });
            }}
          />
        </InformationDisplayCard>
        <InformationDisplayCard title="Criteria" md={8} xs={24} sm={24} subtitle="How do you want to gate who is approved?">
          {/* Choose between codes, whitelist, and password */}
          {showMintingOnlyFeatures && !initiatedByListLocked && (
            <Tabs
              fullWidth
              type="underline"
              tab={
                distributionMethod === DistributionMethod.None ? 'address' : distributionMethod === DistributionMethod.Claims ? 'builder' : 'address'
              }
              setTab={(e) => {
                if (e === 'codes' || e === 'builder') {
                  setDistributionMethodAndReset(DistributionMethod.Claims);
                } else {
                  setDistributionMethodAndReset(DistributionMethod.None);
                }
              }}
              tabInfo={[
                {
                  content: 'Decentralized',
                  key: 'address'
                },
                {
                  content: 'Claims',
                  key: 'builder'
                }
              ]}
            />
          )}
          {distributionMethod !== DistributionMethod.Claims && (
            <>
              <br />
              <div className="secondary-text text-center" style={{ fontSize: 12 }}>
                <InfoCircleOutlined /> These options are enforced in a decentralized manner.
              </div>
              <br />
            </>
          )}

          {(distributionMethod === DistributionMethod.None || distributionMethod === DistributionMethod.Whitelist) && (
            <AddressListSelectComponent
              disabled={initiatedByListLocked}
              approvalToAdd={approvalToAdd}
              setApprovalToAdd={setApprovalToAdd}
              collectionId={collectionId}
              type="initiatedBy"
            />
          )}

          {approvalToAdd.initiatedByList.whitelist && showMintingOnlyFeatures && (
            <>
              <TableRow
                labelSpan={16}
                valueSpan={8}
                label={'Store whitelist off-chain?'}
                value={
                  <Switch
                    disabled={initiatedByListLocked || distributionMethod === DistributionMethod.Claims}
                    checked={distributionMethod === DistributionMethod.Whitelist}
                    onChange={(checked) => {
                      setDistributionMethodAndReset(checked ? DistributionMethod.Whitelist : DistributionMethod.None);
                    }}
                  />
                }
              />
              <div className="px-2 secondary-text" style={{ fontSize: 12, textAlign: 'start' }}>
                This will still be decentralized using the IPFS protocol.
              </div>
            </>
          )}

          {distributionMethod === DistributionMethod.Claims && (
            <>
              <br />
              <BitBadgesClaimLogo />

              <div className="secondary-text text-center" style={{ fontSize: 12 }}>
                Add custom criteria for a claim that BitBadges will enforce. Feel free to combine these claims with other self-implemented solutions
                (e.g. give codes to in-person customers). This is an off-chain solution.
              </div>
              <br />
              <ClaimBuilder
                type='balances'
                claim={{
                  claimId: claimId.current,
                  plugins: plugins
                }}
                isUpdate={false} // no updates for approvals are currently supported
                plugins={plugins}
                setPlugins={(plugins) => {
                  const maxUses = getPluginDetails('numUses', plugins)?.publicParams?.maxUses || 0;
                  const maxUsesPerAddress = getPluginDetails('numUses', plugins)?.publicParams?.maxUsesPerAddress || 0;
                  setMaxUses(BigInt(maxUses), 'overall');
                  setMaxUses(BigInt(maxUsesPerAddress), 'initiatedBy');
                  setPlugins(plugins);
                }}
                offChainSelect={false}
                setDisabled={setDisabled}
              />
            </>
          )}

          {distributionMethod !== DistributionMethod.Claims && (
            <TableRow
              labelSpan={16}
              valueSpan={8}
              label={<>Must own specific badges?</>}
              value={
                <>
                  <Switch
                    checked={mustOwnBadges.length > 0 || showMustOwnBadges}
                    onChange={(checked) => {
                      setMustOwnBadges([]);
                      setShowMustOwnBadges(checked);
                    }}
                  />
                </>
              }
            />
          )}
          {showMustOwnBadges && (
            <InformationDisplayCard
              title={''}
              subtitle={
                'Select badges that the approver must own (or not own) at the time of transfer. Only works for badges with on-chain balances.'
              }
              span={24}
              noPadding
              inheritBg
              noBorder>
              <div className="primary-text">
                <br />

                <BalanceInput
                  fullWidthCards
                  isMustOwnBadgesInput
                  noOffChainBalances
                  message="Must Own Badges"
                  balancesToShow={BalanceArray.From(
                    mustOwnBadges.map((x) => {
                      return {
                        ...x,
                        amount: x.amountRange.start,
                        ownershipTimes: UintRangeArray.FullRanges()
                      };
                    })
                  )}
                  mustOwnBadges={mustOwnBadges.map((x) => new MustOwnBadges(x))}
                  onAddBadges={(balance, amountRange, collectionId, mustSatisfyForAllAssets, overrideWithCurrentTime) => {
                    if (!collectionId || !amountRange) return;

                    setMustOwnBadges(
                      [
                        ...mustOwnBadges,
                        {
                          collectionId: collectionId,
                          overrideWithCurrentTime: !!overrideWithCurrentTime,
                          amountRange: amountRange,
                          badgeIds: balance.badgeIds,
                          ownershipTimes: balance.ownershipTimes,
                          mustSatisfyForAllAssets: !!mustSatisfyForAllAssets
                        }
                      ].map((x) => new MustOwnBadges(x))
                    );
                  }}
                  onRemoveAll={() => {
                    setMustOwnBadges([]);
                  }}
                  // setBalances={setBalances}
                  collectionId={collectionId}
                />
              </div>
            </InformationDisplayCard>
          )}
        </InformationDisplayCard>
      </div>
      <Row style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className="primary-text">
        <div className="flex flex-wrap full-width">
          <InformationDisplayCard title={<>From {fromListLocked && <LockOutlined />}</>} md={8} xs={24} sm={24} subtitle="Who can send the badges?">
            <AddressListSelectComponent
              approvalToAdd={approvalToAdd}
              setApprovalToAdd={setApprovalToAdd}
              collectionId={collectionId}
              nonMintOnlyApproval={nonMintOnlyApproval}
              type="from"
              disabled={fromListLocked}
            />
            {!fromListLocked && (
              <>
                {!hideCollectionOnlyFeatures && (
                  <TableRow
                    labelSpan={16}
                    valueSpan={8}
                    label={'Do not check outgoing approvals?'}
                    value={
                      <Switch
                        disabled={fromListLocked}
                        checked={approvalToAdd.approvalCriteria.overridesFromOutgoingApprovals}
                        onChange={(checked) => {
                          setApprovalToAdd({
                            ...approvalToAdd,
                            approvalCriteria: {
                              ...approvalToAdd.approvalCriteria,
                              overridesFromOutgoingApprovals: checked
                            }
                          });
                        }}
                      />
                    }
                  />
                )}
                <TableRow
                  labelSpan={16}
                  valueSpan={8}
                  label={'Sender must be approver?'}
                  value={
                    <Switch
                      checked={requireFromEqualsInitiatedBy}
                      onChange={(checked) => {
                        //Other changes are made in the global useEffect above
                        setApprovalToAdd({
                          ...approvalToAdd,
                          approvalCriteria: {
                            ...approvalToAdd.approvalCriteria,
                            requireFromEqualsInitiatedBy: checked
                          }
                        });
                      }}
                      disabled={fromListLocked}
                    />
                  }
                />
                <TableRow
                  labelSpan={16}
                  valueSpan={8}
                  label={'Sender must not be approver?'}
                  value={
                    <Switch
                      checked={requireFromDoesNotEqualInitiatedBy}
                      onChange={(checked) => {
                        setApprovalToAdd({
                          ...approvalToAdd,
                          approvalCriteria: {
                            ...approvalToAdd.approvalCriteria,
                            requireFromDoesNotEqualInitiatedBy: checked
                          }
                        });
                      }}
                      disabled={fromListLocked}
                    />
                  }
                />
              </>
            )}

            {requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy && (
              <div style={{ color: 'red' }}>Sender cannot be both approver and not approver.</div>
            )}
            {requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy && (
              <div style={{ color: 'red' }}>Sender cannot be sender, recipient, and approver.</div>
            )}
            {requireFromEqualsInitiatedBy && (
              <>
                <br />
                <div className="secondary-text">Since the sender must be the approver, all restrictions for the approver will apply here.</div>
              </>
            )}
          </InformationDisplayCard>
          <InformationDisplayCard title="To" md={8} xs={24} sm={24} subtitle="Who can receive the badges?">
            {!requireToEqualsInitiatedBy && (
              <AddressListSelectComponent
                disabled={toListLocked}
                approvalToAdd={approvalToAdd}
                setApprovalToAdd={setApprovalToAdd}
                collectionId={collectionId}
                type="to"
              />
            )}
            {!hideCollectionOnlyFeatures && (
              <TableRow
                labelSpan={16}
                valueSpan={8}
                label={'Do not check incoming approvals?'}
                value={
                  <Switch
                    disabled={toListLocked}
                    checked={approvalToAdd.approvalCriteria.overridesToIncomingApprovals}
                    onChange={(checked) => {
                      setApprovalToAdd({
                        ...approvalToAdd,
                        approvalCriteria: {
                          ...approvalToAdd.approvalCriteria,
                          overridesToIncomingApprovals: checked
                        }
                      });
                    }}
                  />
                }
              />
            )}
            {!requireToDoesNotEqualInitiatedBy && (
              <TableRow
                labelSpan={16}
                valueSpan={8}
                label={'Recipient must be approver?'}
                value={
                  <Switch
                    disabled={toListLocked}
                    checked={requireToEqualsInitiatedBy}
                    onChange={(checked) => {
                      //Other changes are made in the global useEffect above
                      setApprovalToAdd({
                        ...approvalToAdd,
                        approvalCriteria: {
                          ...approvalToAdd.approvalCriteria,
                          requireToEqualsInitiatedBy: checked
                        }
                      });
                    }}
                  />
                }
              />
            )}
            {!requireToEqualsInitiatedBy && (
              <TableRow
                labelSpan={16}
                valueSpan={8}
                label={'Recipient must not be approver?'}
                value={
                  <Switch
                    disabled={toListLocked}
                    checked={requireToDoesNotEqualInitiatedBy}
                    onChange={(checked) => {
                      setApprovalToAdd({
                        ...approvalToAdd,
                        approvalCriteria: {
                          ...approvalToAdd.approvalCriteria,
                          requireToDoesNotEqualInitiatedBy: checked
                        }
                      });
                    }}
                  />
                }
              />
            )}
            {requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy && (
              <div style={{ color: 'red' }}>Recipient cannot be both approver and not approver.</div>
            )}
            {requireFromEqualsInitiatedBy && requireToEqualsInitiatedBy && (
              <div style={{ color: 'red' }}>Recipient cannot be sender, recipient, and approver.</div>
            )}

            {requireToEqualsInitiatedBy && (
              <>
                <br />
                <div className="secondary-text">Since the recipient must be the approver, all restrictions for the approver will apply here.</div>
              </>
            )}
          </InformationDisplayCard>
          <InformationDisplayCard title="Transfer Times" md={8} xs={24} sm={24} subtitle="When can this approval be used?">
            <DateSelectWithSwitch
              timeRanges={UintRangeArray.From(approvalToAdd.transferTimes)}
              setTimeRanges={(transferTimes) => {
                setApprovalToAdd({
                  ...approvalToAdd,
                  transferTimes
                });
              }}
            />
          </InformationDisplayCard>
        </div>

        <div className="flex flex-wrap full-width">
          <BadgeIdsSelectCard
            collectionId={collectionId}
            approvalToAdd={approvalToAdd}
            setAmountProperties={setAmountProperties}
            showMintingOnlyFeatures={!!showMintingOnlyFeatures}
            distributionMethod={distributionMethod}
          />
          <InformationDisplayCard
            md={8}
            xs={24}
            sm={24}
            title="Ownership Times"
            subtitle="Which ownership times for the badges are to be transferred?">
            <DateSelectWithSwitch timeRanges={UintRangeArray.From(approvalToAdd.ownershipTimes)} setTimeRanges={setOwnershipTimes} />
          </InformationDisplayCard>
          <ApprovalSelectAmountsCard
            collectionId={collectionId}
            approvalToAdd={approvalToAdd}
            setApprovalToAdd={setApprovalToAdd}
            expectedPartitions={getExpectedNumTransfers(approvalToAdd, distributionMethod)}
            distributionMethod={distributionMethod}
            fromListLocked={!!fromListLocked}
            toListLocked={!!toListLocked}
            initiatedByListLocked={!!initiatedByListLocked}
            tab={amountsTab}
            setTab={setAmountsTabAndReset}
            plugins={plugins}
          />
        </div>
      </Row>
      <button
        className="landing-button"
        style={{ width: '100%', marginTop: 16 }}
        disabled={isFormDisabled}
        onClick={() => {
          //Set them here
          const codes = [];
          const addresses = [];

          const newApprovalToAdd: iCollectionApprovalWithDetails<bigint> & {
            approvalCriteria: iApprovalCriteriaWithDetails<bigint>;
          } = approvalToAdd;

          const treeOptions = {
            fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000'
          };

          const merkleChallenge: any = {
            root: '',
            expectedProofLength: 0n,
            uri: '',
            customData: '',
            useCreatorAddressAsLeaf: false,
            maxUsesPerLeaf: 0n
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
          } as any;

          if (distributionMethod === DistributionMethod.Claims) {
            const seedCode = defaultApproval?.details?.challengeDetails?.leavesDetails.seedCode || crypto.randomBytes(32).toString('hex');
            codes.push(...generateCodesFromSeed(seedCode, Number(numRecipients)));

            const hashedCodes = codes.map((x) => SHA256(x).toString());
            const codesTree = new MerkleTree(hashedCodes, SHA256, treeOptions);
            const codesRoot = codesTree.getRoot().toString('hex');

            merkleChallenge.root = codesRoot ? codesRoot : '';
            merkleChallenge.expectedProofLength = BigInt(codesTree.getLayerCount() - 1);
            merkleChallenge.useCreatorAddressAsLeaf = false;
            merkleChallenge.maxUsesPerLeaf = 1n;

            details.challengeDetails.leavesDetails.leaves = hashedCodes;
            details.challengeDetails.leavesDetails.isHashed = true;
            details.challengeDetails.leavesDetails.seedCode = seedCode;
            details.challengeDetails.numLeaves = BigInt(numRecipients);
            details.challengeDetails.treeOptions = treeOptions;

            const pluginsToAdd = [];
            pluginsToAdd.push({
              id: 'numUses',
              privateParams: getPlugin('numUses').getBlankPrivateParams(),
              publicParams: { maxUses: codes.length },
              publicState: getPlugin('numUses').getBlankPublicState()
            });
            pluginsToAdd.push(getBlankPlugin('requiresProofOfAddress'));
            pluginsToAdd.push({
              id: 'transferTimes',
              privateParams: getPlugin('transferTimes').getBlankPrivateParams(),
              publicParams: { transferTimes: UintRangeArray.From(approvalToAdd.transferTimes) },
              publicState: getPlugin('transferTimes').getBlankPublicState()
            });

            pluginsToAdd.push(...plugins.filter((x) => x.id !== 'numUses' && x.id !== 'transferTimes' && x.id !== 'requiresProofOfAddress'));

            //One claim builder per approvalId
            details.offChainClaims = [
              {
                claimId: newApprovalToAdd.amountTrackerId ? newApprovalToAdd.amountTrackerId : amountTrackerId.current,
                plugins: pluginsToAdd
              }
            ];

            newApprovalToAdd.details = details;
            newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>;
          } else if (distributionMethod === DistributionMethod.Whitelist) {
            const toAddresses = approvalToAdd.initiatedByList.addresses;
            newApprovalToAdd.initiatedByList = AddressList.AllAddresses();
            newApprovalToAdd.initiatedByListId = 'All';

            addresses.push(...toAddresses.map((x) => convertToCosmosAddress(x)));
            const addressesTree = new MerkleTree(
              addresses.map((x) => SHA256(x)),
              SHA256,
              treeOptions
            );
            const addressesRoot = addressesTree.getRoot().toString('hex');

            merkleChallenge.root = addressesRoot ? addressesRoot : '';
            merkleChallenge.expectedProofLength = BigInt(addressesTree.getLayerCount() - 1);
            merkleChallenge.useCreatorAddressAsLeaf = true;
            merkleChallenge.maxUsesPerLeaf = 1n;

            details.challengeDetails.leavesDetails.leaves = addresses;
            details.challengeDetails.leavesDetails.isHashed = false;
            details.challengeDetails.numLeaves = BigInt(numRecipients);
            details.challengeDetails.treeOptions = treeOptions;

            newApprovalToAdd.details = details;
            newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>;
          } else {
            newApprovalToAdd.approvalCriteria.merkleChallenge = undefined;
            newApprovalToAdd.details = details;
          }

          const autoGenerateIds = true;
          if (autoGenerateIds) {
            newApprovalToAdd.amountTrackerId = newApprovalToAdd.amountTrackerId ? newApprovalToAdd.amountTrackerId : amountTrackerId.current;
            newApprovalToAdd.approvalId = newApprovalToAdd.approvalId ? newApprovalToAdd.approvalId : amountTrackerId.current;
            newApprovalToAdd.challengeTrackerId = newApprovalToAdd.challengeTrackerId ? newApprovalToAdd.challengeTrackerId : amountTrackerId.current;
          }

          //If we have no off-chain details, it doesn't make sense to add them to storage
          const newDetails = newApprovalToAdd.details;
          if (!newDetails?.name && !newDetails?.description && !newDetails?.challengeDetails?.leavesDetails.leaves.length) {
            newApprovalToAdd.details = undefined;
          }

          const newApprovalsToAdd = [...approvalsToAdd, deepCopyPrimitives(newApprovalToAdd)];
          const isValidUpdateError = validateCollectionApprovalsUpdate(
            startingApprovals,
            newApprovalsToAdd.map((x) => new CollectionApprovalWithDetails(x)),
            approvalPermissions
          );
          if (
            isValidUpdateError &&
            !confirm(
              'This update is disallowed by the collection permissions. Please confirm this was intended. Details: ' + isValidUpdateError.message
            )
          ) {
            return;
          }

          //We need to replace the existing one
          if (defaultApproval) {
            setApprovalsToAdd(
              [...approvalsToAdd.map((x) => (x.approvalId === approvalToAdd.approvalId ? deepCopyPrimitives(newApprovalToAdd) : x))].map(
                (x) => new CollectionApprovalWithDetails(x)
              )
            );
          } else {
            setApprovalsToAdd([...approvalsToAdd, deepCopyPrimitives(newApprovalToAdd)].map((x) => new CollectionApprovalWithDetails(x)));
          }

          setApprovalToAdd(deepCopyPrimitives(defaultApprovalToAdd));

          if (setVisible) setVisible(false);
        }}>
        {isEdit ? 'Edit Approval' : 'Set Approval'}
      </button>
      {isEdit && (
        <div className="flex-center secondary-text">
          <InfoCircleOutlined /> This will overwrite the approval you selected to edit.
        </div>
      )}
      <br />
    </>
  );
}

const getExpectedNumTransfers = (approval: RequiredApprovalProps, distributionMethod: DistributionMethod) => {
  //Else, reverse engineer the approval to find the number of increments applied
  const overallBadgeIdEnd = approval.badgeIds?.[0]?.end || 1n;
  const predeterminedBadgeIdEnd = approval.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances?.[0]?.badgeIds?.[0]?.end || 1n;
  const increment = approval.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy || 0n;
  if (increment === 0n) {
    if (distributionMethod === DistributionMethod.Claims) {
      return getMaxTransfersApplied(approval); //Min non-zero value of num claims and num claims per initiator
    }

    return 1n;
  }

  const difference = overallBadgeIdEnd - predeterminedBadgeIdEnd;
  const numIncrements = difference / increment;
  return numIncrements + 1n;
};

const BadgeIdsSelectCard = ({
  approvalToAdd,
  collectionId,
  distributionMethod,
  setAmountProperties,
  showMintingOnlyFeatures
}: {
  approvalToAdd: RequiredApprovalProps;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  setAmountProperties: ({
    badgeIds,
    increment,
    numIncrements,
    ownershipTimes
  }: {
    badgeIds?: iUintRange<bigint>[];
    increment?: bigint;
    numIncrements?: bigint;
    ownershipTimes?: iUintRange<bigint>[];
  }) => void;
  showMintingOnlyFeatures: boolean;
}) => {
  const approvalCriteria = approvalToAdd.approvalCriteria;
  const increment = approvalCriteria?.predeterminedBalances?.incrementedBalances?.incrementBadgeIdsBy || 0n;
  const hasIncrements = increment > 0n;

  //It is also if amountsTab == AllOrNothing but IDs are same as start balances (increment == 0) so this is fine
  const usesPredeterminedBalances = hasIncrements || distributionMethod === DistributionMethod.Claims;

  //If we are using predetermined balances, the user's selected badge IDs are the start balances
  //If we are not, the user's selected badge IDs are the overall badge IDs
  const selectedBadgeIds = usesPredeterminedBalances
    ? UintRangeArray.From(approvalToAdd.approvalCriteria?.predeterminedBalances?.incrementedBalances.startBalances?.[0]?.badgeIds ?? [])
    : UintRangeArray.From(approvalToAdd.badgeIds);

  const setBadgeIds = (badgeIds: iUintRange<bigint>[]) => {
    setAmountProperties({ badgeIds });
  };

  const setIncrement = (increment: bigint) => {
    setAmountProperties({ increment });
  };

  const setNumTransfers = (numTransfers: bigint) => {
    setAmountProperties({
      numIncrements: numTransfers - 1n
    });
  };

  return (
    <InformationDisplayCard title="Badge IDs" md={8} xs={24} sm={24} subtitle="Which badges are to be transferred?">
      <br />

      <BadgeIDSelectWithSwitch
        disabled={hasIncrements}
        collectionId={collectionId}
        uintRanges={selectedBadgeIds}
        setUintRanges={(badgeIds) => {
          setBadgeIds(badgeIds);
        }}
        incrementBadgeIdsBy={increment}
        setIncrementBadgeIdsBy={(increment) => {
          setIncrement(increment);
        }}
        numRecipients={getExpectedNumTransfers(approvalToAdd, distributionMethod)}
        setNumRecipients={
          showMintingOnlyFeatures
            ? (numRecipients) => {
                setNumTransfers(numRecipients);
              }
            : undefined
        }
      />

      {approvalToAdd.badgeIds.length === 0 && (
        <div style={{ color: 'red' }}>
          <WarningOutlined /> Badge IDs cannot be empty.
        </div>
      )}

      {increment > 0 && (
        <div className="secondary-text" style={{ fontSize: 12 }}>
          <br />
          <p>
            <InfoCircleOutlined /> See the Amounts card to customize the assignment of increments.
          </p>
        </div>
      )}
    </InformationDisplayCard>
  );
};
