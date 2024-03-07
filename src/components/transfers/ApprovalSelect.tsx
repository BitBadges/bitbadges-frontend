import { InfoCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Row, Switch, Tooltip, Typography } from 'antd';
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
  validateCollectionApprovalsUpdate
} from 'bitbadgesjs-sdk';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DistributionMethod } from '../../bitbadges-api/types';
import { approvalCriteriaUsesPredeterminedBalances } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { IntegrationPluginDetails, getBlankPlugin, getPlugin, getPluginDetails } from '../../integrations/integrations';
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
import { MaxUses } from './ApprovalSelectHelpers/MaxUsesSelectComponent';
import { ClaimBuilder } from './ClaimBuilder';
import { ClaimMetadataSelect } from './ClaimMetadataSelectStep';
import { BitBadgesClaimLogo } from '../../pages/lists/[listId]';

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
export const getMaxIncrementsApplied = (approvalToAdd: RequiredApprovalProps) => {
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

export const getAllApprovedBadges = (approvalToAdd: RequiredApprovalProps, startBalances: BalanceArray<bigint>, increment: bigint) => {
  if (!approvalCriteriaUsesPredeterminedBalances(approvalToAdd.approvalCriteria)) {
    return approvalToAdd.badgeIds;
  } else {
    const maxIncrementsApplied = getMaxIncrementsApplied(approvalToAdd);
    const allApprovedBadges = getAllBadgeIdsToBeTransferred([
      new TransferWithIncrements({
        from: '',
        balances: startBalances.map((x) => {
          return { ...x, amount: 1n };
        }),
        toAddressesLength: maxIncrementsApplied,
        toAddresses: [],
        incrementBadgeIdsBy: increment,
        incrementOwnershipTimesBy: 0n
      })
    ]);
    return allApprovedBadges;
  }
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

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));
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
      hasPassword: false,
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

  const [approvalToAdd, setApprovalToAdd] = useState<
    iCollectionApprovalWithDetails<bigint> & {
      approvalCriteria: Required<iApprovalCriteriaWithDetails<bigint>>;
      details: iApprovalInfoDetails<bigint>;
    }
  >(deepCopyPrimitives(defaultApprovalToAdd));

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
  const increment = approvalCriteria?.predeterminedBalances?.incrementedBalances?.incrementBadgeIdsBy || 0n;
  const startBalances = approvalCriteria.predeterminedBalances?.incrementedBalances?.startBalances || [];
  const defaultClaim =
    defaultApprovalToAdd.details.offChainClaims && defaultApprovalToAdd.details.offChainClaims.length > 0
      ? defaultApprovalToAdd.details.offChainClaims[0]
      : undefined;

  const uintRangesOverlap = UintRangeArray.From(approvalToAdd?.badgeIds).hasOverlaps();
  const uintRangesLengthEqualsZero = approvalToAdd?.badgeIds.length === 0;

  const ownedTimesOverlap = UintRangeArray.From(approvalToAdd?.ownershipTimes).hasOverlaps();
  const ownedTimesLengthEqualsZero = approvalToAdd?.ownershipTimes.length === 0;

  const transferTimesOverlap = UintRangeArray.From(approvalToAdd?.transferTimes).hasOverlaps();
  const transferTimesLengthEqualsZero = approvalToAdd?.transferTimes.length === 0;

  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(
    defaultClaim ? DistributionMethod.Codes : DistributionMethod.Whitelist
  );

  const [showMustOwnBadges, setShowMustOwnBadges] = useState(approvalCriteria?.mustOwnBadges?.length > 0);
  const [distributionType, setDistributionType] = useState<DistributionType>(
    defaultClaim ? (defaultClaim.manualDistribution ? DistributionType.Manual : DistributionType.Builder) : DistributionType.None
  );
  const [plugins, setPlugins] = useState<IntegrationPluginDetails<ClaimIntegrationPluginType>[]>(defaultClaim?.plugins || []);
  const [disabled, setDisabled] = useState(false);

  const passwordPlugin = getPluginDetails('password', plugins);
  const claimPassword = passwordPlugin?.privateParams?.password;

  const isPartitionView = increment > 0n;

  const [expectedPartitions, setExpectedPartitions] = useState<bigint>(1n);

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

    if (distributionMethod === DistributionMethod.Codes) {
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

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('distributionMethod');
    if (distributionType !== DistributionType.Builder && plugins.length > 0) {
      setPlugins([]);
    }
  }, [distributionType, plugins]);

  const LearnMore = (
    <div style={{ textAlign: 'center' }} className="secondary-text">
      <br />
      <p>
        <InfoCircleOutlined /> This is a centralized solution.{' '}
        <Tooltip
          color="black"
          title="For a better user experience, codes, passwords, and challenges are facilitated by BitBadges to make it easier for you. Decentralized alternatives are always available (see documentation).">
          Hover to learn more.
        </Tooltip>
      </p>
    </div>
  );

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
                distributionMethod === DistributionMethod.None
                  ? 'address'
                  : distributionMethod === DistributionMethod.Codes
                    ? distributionType === DistributionType.Manual
                      ? 'codes'
                      : distributionType === DistributionType.Builder
                        ? 'builder'
                        : 'none'
                    : 'address'
              }
              setTab={(e) => {
                if (e === 'codes' || e === 'builder') {
                  setDistributionMethod(DistributionMethod.Codes);
                  setDistributionType(DistributionType.Manual);
                  setExpectedPartitions(1n);
                  setMaxUses(1n, 'overall');
                  setMaxUses(1n, 'initiatedBy');

                  setDistributionMethod(DistributionMethod.Codes);
                  setExpectedPartitions(1n);
                  setMaxUses(1n, 'overall');
                  setMaxUses(1n, 'initiatedBy');

                  setApprovalToAdd((approvalToAdd) => {
                    return {
                      ...approvalToAdd,
                      approvalCriteria: {
                        ...approvalToAdd.approvalCriteria,
                        predeterminedBalances: {
                          ...approvalToAdd.approvalCriteria.predeterminedBalances,
                          manualBalances: [],
                          incrementedBalances: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                            startBalances: [],
                            incrementBadgeIdsBy: 0n,
                            incrementOwnershipTimesBy: 0n
                          },
                          orderCalculationMethod: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
                            useOverallNumTransfers: false,
                            usePerFromAddressNumTransfers: false,
                            usePerInitiatedByAddressNumTransfers: false,
                            usePerToAddressNumTransfers: false,
                            useMerkleChallengeLeafIndex: false
                          }
                        }
                      }
                    };
                  });

                  if (e === 'builder') {
                    setDistributionType(DistributionType.Builder);
                    setPlugins([
                      {
                        id: 'numUses',
                        publicParams: {
                          maxUses: 1
                        },
                        privateParams: getPlugin('numUses').getBlankPrivateParams(),
                        publicState: getPlugin('numUses').getBlankPublicState()
                      }
                    ]);
                  } else if (e === 'codes') {
                    setDistributionType(DistributionType.Manual);
                  } else {
                    setDistributionMethod(DistributionMethod.None);
                  }
                } else {
                  setDistributionMethod(DistributionMethod.None);
                }
              }}
              tabInfo={[
                {
                  content: 'By Address',
                  key: 'address'
                },
                {
                  content: 'Codes',
                  key: 'codes'
                },
                {
                  content: 'Claims',
                  key: 'builder'
                }
              ]}
            />
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
            <TableRow
              labelSpan={16}
              valueSpan={8}
              label={'Store whitelist off-chain?'}
              value={
                <Switch
                  disabled={initiatedByListLocked || distributionMethod === DistributionMethod.Codes}
                  checked={distributionMethod === DistributionMethod.Whitelist}
                  onChange={(checked) => {
                    //Other changes are made in the global useEffect above
                    if (checked) {
                      setDistributionMethod(DistributionMethod.Whitelist);
                    } else {
                      setDistributionMethod(DistributionMethod.None);
                    }
                  }}
                />
              }
            />
          )}

          {distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.Manual && (
            <>
              <br />

              <div className="flex-center flex-wrap flex-column">
                <MaxUses
                  setExpectedPartitions={setExpectedPartitions}
                  isCodeDisplay
                  approvalToAdd={approvalToAdd}
                  setApprovalToAdd={setApprovalToAdd}
                  type="overall"
                  distributionMethod={distributionMethod}
                  disabled={initiatedByListLocked}
                />
              </div>
              <br />
              <div className="text-center secondary-text">
                <p>
                  We will generate N claim codes for you to distribute manually however you would like. Codes will be viewable along with helper
                  distribution tools on the next step of this form. Users can navigate to the claim page to enter codes and claim badges.
                </p>
              </div>
            </>
          )}
          {distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.Builder && (
            <>
              <br />
              <BitBadgesClaimLogo />
              <br />
              <ClaimBuilder
                isUpdate={false} // no updates for approvals are currently supported
                plugins={plugins}
                setPlugins={(plugins) => {
                  const maxUses = getPluginDetails('numUses', plugins)?.publicParams?.maxUses || 0;
                  setPlugins(plugins);
                  setMaxUses(BigInt(maxUses), 'overall');
                  setMaxUses(1n, 'initiatedBy');
                  setExpectedPartitions(BigInt(maxUses));
                }}
                offChainSelect={false}
                setDisabled={setDisabled}
              />
            </>
          )}
          {distributionMethod === DistributionMethod.Codes && LearnMore}

          {distributionMethod !== DistributionMethod.Codes && (
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
          <InformationDisplayCard
            title={
              <>
                From <LockOutlined />
              </>
            }
            md={8}
            xs={24}
            sm={24}
            subtitle="Who can send the badges?">
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
          <InformationDisplayCard title="Badge IDs" md={8} xs={24} sm={24} subtitle="Which badges are to be transferred?">
            {
              <>
                <br />

                <BadgeIDSelectWithSwitch
                  disabled={isPartitionView}
                  collectionId={collectionId}
                  uintRanges={UintRangeArray.From(approvalToAdd.badgeIds)}
                  setUintRanges={(badgeIds) => {
                    setApprovalToAdd((approvalToAdd) => {
                      return {
                        ...approvalToAdd,
                        badgeIds: badgeIds
                      };
                    });
                  }}
                  incrementBadgeIdsBy={increment}
                  setIncrementBadgeIdsBy={(increment) => {
                    setApprovalToAdd((approvalToAdd) => {
                      return {
                        ...approvalToAdd,
                        approvalCriteria: {
                          ...approvalToAdd.approvalCriteria,
                          predeterminedBalances: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances,
                            incrementedBalances: {
                              ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                              incrementBadgeIdsBy: increment
                            }
                          }
                        }
                      };
                    });
                  }}
                  numRecipients={expectedPartitions}
                  setNumRecipients={
                    distributionMethod === DistributionMethod.Codes || !showMintingOnlyFeatures
                      ? undefined
                      : (numRecipients) => {
                          setExpectedPartitions(numRecipients);
                        }
                  }
                />

                {approvalToAdd.badgeIds.length === 0 && (
                  <div style={{ color: 'red' }}>
                    <WarningOutlined /> Badge IDs cannot be empty.
                  </div>
                )}

                {distributionMethod === DistributionMethod.Codes && isPartitionView && (
                  <div className="secondary-text" style={{ textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                    <LockOutlined /> To edit number of recipients, edit the number of claims.
                  </div>
                )}
              </>
            }
          </InformationDisplayCard>

          <InformationDisplayCard
            md={8}
            xs={24}
            sm={24}
            title="Ownership Times"
            subtitle="Which ownership times for the badges are to be transferred?">
            <DateSelectWithSwitch
              timeRanges={UintRangeArray.From(approvalToAdd.ownershipTimes)}
              setTimeRanges={(ownershipTimes) => {
                setApprovalToAdd({
                  ...approvalToAdd,
                  ownershipTimes
                });
              }}
            />
          </InformationDisplayCard>
          <ApprovalSelectAmountsCard
            collectionId={collectionId}
            approvalToAdd={approvalToAdd}
            setApprovalToAdd={setApprovalToAdd}
            expectedPartitions={expectedPartitions}
            distributionMethod={distributionMethod}
            distributionType={distributionType}
            fromListLocked={!!fromListLocked}
            toListLocked={!!toListLocked}
            initiatedByListLocked={!!initiatedByListLocked}
          />
        </div>
      </Row>
      <button
        className="landing-button"
        style={{ width: '100%', marginTop: 16 }}
        disabled={
          (distributionType === DistributionType.Builder && disabled) ||
          new AddressList(approvalToAdd.fromList).isEmpty() ||
          new AddressList(approvalToAdd.toList).isEmpty() ||
          new AddressList(approvalToAdd.initiatedByList).isEmpty() ||
          approvalToAdd.badgeIds.length === 0 ||
          approvalToAdd.ownershipTimes.length === 0 ||
          approvalToAdd.transferTimes.length === 0 ||
          uintRangesOverlap ||
          uintRangesLengthEqualsZero ||
          ownedTimesOverlap ||
          ownedTimesLengthEqualsZero ||
          (requireFromDoesNotEqualInitiatedBy && requireFromEqualsInitiatedBy) ||
          (requireToDoesNotEqualInitiatedBy && requireToEqualsInitiatedBy) ||
          (distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.None) ||
          approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.find(
            (x) =>
              x.amount <= 0n ||
              UintRangeArray.From(x.badgeIds).hasOverlaps() ||
              UintRangeArray.From(x.ownershipTimes).hasOverlaps() ||
              x.badgeIds.length === 0 ||
              x.ownershipTimes.length === 0
          )
            ? true
            : false ||
              ((approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0n ||
                approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0n) &&
                !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
                !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers &&
                !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers &&
                !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers &&
                !approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex) ||
              (nonMintOnlyApproval && new AddressList(approvalToAdd.fromList).checkAddress('Mint')) ||
              (!!approvalsToAdd.find((x) => x.approvalId === approvalToAdd.approvalId) && !defaultApproval) ||
              (nonMintOnlyApproval && new AddressList(approvalToAdd.fromList).checkAddress('Mint')) ||
              transferTimesOverlap ||
              transferTimesLengthEqualsZero ||
              (startBalances.length > 0 && startBalances.some((x) => x.amount <= 0n)) ||
              (distributionMethod === DistributionMethod.Codes && distributionType === DistributionType.Builder && plugins.length === 0) ||
              getMaxIncrementsApplied(approvalToAdd) !== expectedPartitions
        }
        onClick={() => {
          //Set them here
          const codes = [];
          const addresses = [];

          const newApprovalToAdd: iCollectionApprovalWithDetails<bigint> & {
            approvalCriteria: iApprovalCriteriaWithDetails<bigint>;
          } = approvalToAdd;

          if (distributionMethod === DistributionMethod.Codes) {
            const seedCode = crypto.randomBytes(32).toString('hex');
            codes.push(...generateCodesFromSeed(seedCode, Number(numRecipients)));

            const hashedCodes = codes.map((x) => SHA256(x).toString());
            const treeOptions = {
              fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000'
            };
            const codesTree = new MerkleTree(hashedCodes, SHA256, treeOptions);
            const codesRoot = codesTree.getRoot().toString('hex');

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
            merkleChallenge.root = codesRoot ? codesRoot : '';
            merkleChallenge.expectedProofLength = BigInt(codesTree.getLayerCount() - 1);
            merkleChallenge.useCreatorAddressAsLeaf = false;
            merkleChallenge.maxUsesPerLeaf = 1n;

            details.challengeDetails.leavesDetails.leaves = hashedCodes;
            details.challengeDetails.leavesDetails.isHashed = true;
            details.challengeDetails.leavesDetails.seedCode = seedCode;
            details.challengeDetails.numLeaves = BigInt(numRecipients);
            details.challengeDetails.password = claimPassword;
            details.challengeDetails.hasPassword = claimPassword ? true : false;
            details.challengeDetails.treeOptions = treeOptions;

            const pluginsToAdd = [];
            if (!plugins.find((x) => x.id === 'numUses')) {
              pluginsToAdd.push({
                id: 'numUses',
                privateParams: getPlugin('numUses').getBlankPrivateParams(),
                publicParams: {
                  maxUses: codes.length
                },
                publicState: getPlugin('numUses').getBlankPublicState()
              });
            }
            pluginsToAdd.push(getBlankPlugin('requiresProofOfAddress'));
            pluginsToAdd.push(...plugins);

            details.offChainClaims = [
              {
                claimId: '',
                plugins: pluginsToAdd,
                manualDistribution: distributionType === DistributionType.Manual
              }
            ];

            newApprovalToAdd.details = details;

            newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>;
          } else if (distributionMethod === DistributionMethod.Whitelist) {
            const toAddresses = approvalToAdd.initiatedByList.addresses;
            newApprovalToAdd.initiatedByList = AddressList.AllAddresses();
            newApprovalToAdd.initiatedByListId = 'All';

            addresses.push(...toAddresses.map((x) => convertToCosmosAddress(x)));
            const treeOptions = {
              fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000'
            };
            const addressesTree = new MerkleTree(
              addresses.map((x) => SHA256(x)),
              SHA256,
              treeOptions
            );
            const addressesRoot = addressesTree.getRoot().toString('hex');

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
            merkleChallenge.root = addressesRoot ? addressesRoot : '';
            merkleChallenge.expectedProofLength = BigInt(addressesTree.getLayerCount() - 1);
            merkleChallenge.useCreatorAddressAsLeaf = true;
            merkleChallenge.maxUsesPerLeaf = 0n;

            details.challengeDetails.leavesDetails.leaves = addresses;
            details.challengeDetails.leavesDetails.isHashed = false;
            details.challengeDetails.numLeaves = BigInt(numRecipients);
            details.challengeDetails.password = '';
            details.challengeDetails.hasPassword = false;
            details.challengeDetails.treeOptions = treeOptions;

            newApprovalToAdd.details = details;
            newApprovalToAdd.approvalCriteria.merkleChallenge = merkleChallenge as MerkleChallengeWithDetails<bigint>;
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
            } as any;
            newApprovalToAdd.details = details;
          }

          const autoGenerateIds = true;
          if (autoGenerateIds) {
            newApprovalToAdd.amountTrackerId = amountTrackerId.current;
            newApprovalToAdd.approvalId = amountTrackerId.current;
            newApprovalToAdd.challengeTrackerId = amountTrackerId.current;
          }

          if (
            !newApprovalToAdd.details?.name &&
            !newApprovalToAdd.details?.description &&
            !newApprovalToAdd.details?.challengeDetails?.leavesDetails.leaves.length
          ) {
            newApprovalToAdd.details = undefined;
          }

          //We have been using approvalToAdd.badgeIds as the start badges, but we need to now set this to all possible badges
          if (isPartitionView) {
            const allPossibleBadgeIds = getAllApprovedBadges(approvalToAdd, BalanceArray.From(startBalances), increment);
            newApprovalToAdd.badgeIds = allPossibleBadgeIds;
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
