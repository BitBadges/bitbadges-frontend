import { DatabaseOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Spin, Tooltip, notification } from 'antd';
import {
  AddressList,
  BalanceArray,
  ClaimIntegrationPluginType,
  CollectionApprovalWithDetails,
  UintRangeArray,
  convertToCosmosAddress
} from 'bitbadgesjs-sdk';
import CryptoJS from 'crypto-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BitBadgesApi, checkAndCompleteClaim } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { EmptyStepItem, NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { areBalancesBitBadgesHosted } from '../../../bitbadges-api/utils/balances';
import { IntegrationPluginDetails, getMaxUses, getPlugin, getPluginDetails } from '../../../integrations/integrations';
import { MarkdownDisplay } from '../../../pages/account/[addressOrUsername]/settings';
import { BitBadgesClaimLogo, hasAlreadyClaimed } from '../../../pages/lists/[listId]';
import { AddressDisplay } from '../../address/AddressDisplay';
import { AddressSelect } from '../../address/AddressSelect';
import {
  BalanceTypeDescription,
  BalancesLastUpdatedRow,
  BalancesStorageRow,
  BalancesUrlRow,
  CanUpdateBalancesUrlRow
} from '../../badges/DistributionCard';
import { BlockinDisplay } from '../../blockin/BlockinDisplay';
import { ErrDisplay } from '../../common/ErrDisplay';
import { Divider } from '../../display/Divider';
import { GenericModal } from '../../display/GenericModal';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { TableRow } from '../../display/TableRow';
import { FormTimeline } from '../../navigation/FormTimeline';
import { Tabs } from '../../navigation/Tabs';
import { PluginTextDisplay } from './DetailsCard';
import { PredeterminedCard } from './PredeterminedCard';
import { PluginCodesModal } from '../../../integrations/codes';
const { SHA256 } = CryptoJS;

export const generateCodesFromSeed = (seedCode: string, numCodes: number): string[] => {
  let currCode = seedCode;
  const codes = [];
  for (let i = 0; i < numCodes; i++) {
    currCode = SHA256(currCode + seedCode).toString();
    codes.push(currCode);
  }
  return codes;
};

export function OffChainTransferabilityTab({ collectionId, badgeId }: { collectionId: bigint; badgeId?: bigint }) {
  const collection = useCollection(collectionId);
  const isBitBadgesHosted = areBalancesBitBadgesHosted(collection);
  const chain = useChainContext();

  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState('criteria');
  const [claimed, setClaimed] = useState(false);
  const [codesModalVisible, setCodesModalVisible] = useState(false);

  const fetchedPlugins = collection && (collection?.offChainClaims ?? []).length > 0 ? collection.offChainClaims[0].plugins : [];
  const claimId = collection && (collection?.offChainClaims ?? []).length > 0 ? collection.offChainClaims[0].claimId : '';
  const claim = collection && (collection?.offChainClaims ?? []).length > 0 ? collection.offChainClaims[0] : undefined;
  const alreadyClaimed = claimed || (claim && hasAlreadyClaimed(claim, chain));

  useEffect(() => {
    if (codesModalVisible) {
      async function fetchPrivateParams() {
        const res = await BitBadgesApi.getCollections({
          collectionsToFetch: [{ collectionId: collectionId, fetchPrivateParams: true }]
        });

        const newColl = res.collections[0];
        updateCollection(newColl);
      }

      fetchPrivateParams();
    }
  }, [codesModalVisible, collectionId]);

  if (!collection) return <></>;

  const offChainBalancesMetadata = collection.getOffChainBalancesMetadata();

  let info: any = {
    assignMethod: 'Balances can be updated by whoever has permission to update what is returned from the server URL.'
  };

  //Fetch badge's metadata (if applicable), else default to collection if not present, else default to auto-generate
  const currMetadata = badgeId ? collection.getBadgeMetadata(badgeId) ?? collection.cachedCollectionMetadata : collection.cachedCollectionMetadata;
  if (currMetadata?.offChainTransferabilityInfo) {
    if (currMetadata.offChainTransferabilityInfo.host) {
      info.host = currMetadata.offChainTransferabilityInfo.host;
    }
    if (currMetadata.offChainTransferabilityInfo.assignMethod) {
      info.assignMethod = currMetadata.offChainTransferabilityInfo.assignMethod;
    }
  } else if (isBitBadgesHosted) {
    info = {
      host: "Balance storage is outsourced to BitBadges.",
      assignMethod: 'Balances can be assigned by the collection manager (if permitted).'
    };
  } else if (offChainBalancesMetadata?.uri === 'https://api.bitbadges.io/api/v0/ethFirstTx/{address}') {
    info = {
      host: 'Balances are hosted and fetched on-demand by the BitBadges API.',
      assignMethod:
        "To determine badge balances, the date of a user's first Ethereum transaction on the mainnet blockchain is queried. See https://github.com/BitBadges/bitbadges-indexer/blob/master/src/routes/ethFirstTx.ts for the full code."
    };
  } else if (offChainBalancesMetadata?.uri === 'https://bitbadges-balances.nyc3.digitaloceanspaces.com/airdrop/balances') {
    info = {
      host: 'Balances are hosted by the BitBadges API.',
      assignMethod: 'Each user is assigned a balance of x1 if they have claimed their BitBadges betanet airdrop.'
    };
  }

  // const claimedBalances = collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.startBalances.clone() : undefined;
  // claimedBalances?.applyIncrements(
  //   collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.incrementBadgeIdsBy ?? 0n : 0n,
  //   collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.incrementOwnershipTimesBy ?? 0n : 0n,
  //   BigInt(getPluginDetails('numUses', fetchedPlugins)?.publicState.claimedUsers[chain.cosmosAddress] ?? 0n)
  // );

  const numUsesPlugin = getPluginDetails('numUses', fetchedPlugins);
  const currNumUses = numUsesPlugin?.publicState.numUses ?? 0n;
  const maxUses = getMaxUses(fetchedPlugins);
  const exceedsMaxUses = numUsesPlugin && currNumUses >= maxUses;

  const BalancesToReceive = () => {
    /* Map it to an on-chain approval for compatibility */
    return (
      <PredeterminedCard
        collectionId={collectionId}
        numIncrementsOverride={BigInt(currNumUses)}
        transfer={
          new CollectionApprovalWithDetails<bigint>({
            fromList: AddressList.Reserved('Mint'),
            toList: AddressList.Reserved('All'),
            initiatedByList: AddressList.Reserved('All'),
            fromListId: 'Mint',
            toListId: 'All',
            initiatedByListId: 'All',
            challengeTrackerId: 'All',
            approvalId: 'All',
            amountTrackerId: 'All',
            transferTimes: UintRangeArray.FullRanges(),
            ownershipTimes: UintRangeArray.FullRanges(),
            badgeIds: UintRangeArray.FullRanges(),
            approvalCriteria: {
              maxNumTransfers: {
                overallMaxNumTransfers: BigInt(maxUses),
                perFromAddressMaxNumTransfers: 0n,
                perToAddressMaxNumTransfers: 0n,
                perInitiatedByAddressMaxNumTransfers: 0n
              },
              predeterminedBalances: {
                incrementedBalances: {
                  startBalances:
                    collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.startBalances : BalanceArray.From([]),
                  incrementBadgeIdsBy: collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.incrementBadgeIdsBy : 0n,
                  incrementOwnershipTimesBy:
                    collection.offChainClaims.length > 0 ? collection.offChainClaims[0].balancesToSet.incrementOwnershipTimesBy : 0n
                },
                orderCalculationMethod: {
                  useMerkleChallengeLeafIndex: false,
                  useOverallNumTransfers: true,
                  usePerFromAddressNumTransfers: false,
                  usePerToAddressNumTransfers: false,
                  usePerInitiatedByAddressNumTransfers: false
                },
                manualBalances: []
              }
            }
          })
        }
      />
    );
  };

  const isPreview = collectionId === NEW_COLLECTION_ID;
  const usesBitBadgesClaimBuilder = (isBitBadgesHosted || isPreview) && collection.offChainClaims.length > 0;

  const numCodes = getPluginDetails('codes', fetchedPlugins)?.publicParams.numCodes ?? 0;
  const seedCode = getPluginDetails('codes', fetchedPlugins)?.privateParams.seedCode;
  const codes = seedCode
    ? generateCodesFromSeed(seedCode, numCodes)
    : getPluginDetails('codes', fetchedPlugins)?.privateParams.codes?.map((x) => x) ?? [];

  return (
    <>
      <GenericModal title="Claim" visible={visible && !alreadyClaimed} setVisible={setVisible} style={{ minWidth: '90%' }}>
        <div className="flex-center">
          <InformationDisplayCard md={24} xs={24} sm={24} title="" style={{ textAlign: 'left' }} noBorder inheritBg>
            <div className="flex-center flex-column">
              {!alreadyClaimed && (
                <>
                  <ClaimInputs
                    claimId={claimId}
                    plugins={fetchedPlugins}
                    docId={claimId}
                    isPreview={isPreview}
                    onSuccess={async (recipientAddress: string) => {
                      setVisible(false);
                      setClaimed(true);

                      const newColl = await BitBadgesApi.getCollections({
                        collectionsToFetch: [{ collectionId: collectionId }]
                      });
                      const claimNumber =
                        (getPluginDetails('numUses', newColl.collections[0].offChainClaims[0].plugins)?.publicState.claimedUsers[recipientAddress] ??
                          0) + 1;

                      notification.success({
                        message: 'Success',
                        description: `You have successfully claimed this badge. Your claim number is #${claimNumber}.`
                      });

                      updateCollection(newColl.collections[0]);
                    }}
                  />
                </>
              )}
            </div>
          </InformationDisplayCard>
        </div>
      </GenericModal>
      <div className="flex flex-wrap">
        {usesBitBadgesClaimBuilder && (
          <InformationDisplayCard
            title={<BitBadgesClaimLogo />}
            subtitle={<>This collection uses the in-site BitBadges claim builder. Badges can be claimed below by anyone who meets the criteria.</>}
            md={12}
            xs={24}
            sm={24}>
            <br />
            <Tabs
              tab={tab}
              setTab={setTab}
              tabInfo={[
                { content: 'Criteria', key: 'criteria' },
                { content: 'Balances', key: 'balances' }
              ]}
              fullWidth
              type="underline"
            />
            <br />
            {tab === 'criteria' && <ClaimCriteriaDisplay plugins={fetchedPlugins} />}
            {tab === 'balances' && <BalancesToReceive />}

            {
              <>
                {!alreadyClaimed && !exceedsMaxUses && (
                  <div className="flex-center">
                    <button
                      className="landing-button"
                      disabled={alreadyClaimed}
                      onClick={() => {
                        setVisible(!visible);
                      }}>
                      <Tooltip title={exceedsMaxUses ? 'There are no more claims available. All have been used.' : 'Claim this badge!'}>
                        Claim
                      </Tooltip>
                    </button>
                  </div>
                )}
                {fetchedPlugins.find((x) => x.id === 'codes') && collection.getManager() === chain.cosmosAddress && (
                  <div className="flex-center flex-column">
                    <br />
                    <IconButton
                      src={<DatabaseOutlined />}
                      text="Codes"
                      onClick={() => {
                        setCodesModalVisible(true);
                      }}
                      secondary
                    />
                    <PluginCodesModal
                      codes={codes ?? []}
                      collectionId={collectionId}
                      visible={codesModalVisible}
                      setVisible={setCodesModalVisible}
                      password={getPluginDetails('password', fetchedPlugins)?.privateParams.password}
                    />
                  </div>
                )}
                {alreadyClaimed && !claimed && (
                  <>
                    <div className="secondary-text mt-4">
                      You have already claimed (claim #{(numUsesPlugin?.publicState.claimedUsers[chain.cosmosAddress] ?? 0) + 1})
                    </div>
                    <div className="flex-center">
                      <AddressDisplay addressOrUsername={chain.address} />
                    </div>
                  </>
                )}
              </>
            }
          </InformationDisplayCard>
        )}
        {!usesBitBadgesClaimBuilder && (
          <InformationDisplayCard title="Distribution" md={12} xs={24} sm={24} style={{ textAlign: 'left' }}>
            <div className="p-2">
              {info.host && (
                <>
                  <b>How are the balances hosted?</b>
                  <br />
                  <div className="flex secondary-text">
                    <MarkdownDisplay markdown={info.host} />
                  </div>
                  <br />
                </>
              )}

              <b>How are balances assigned?</b>
              <br />
              <div className="flex secondary-text">
                <MarkdownDisplay markdown={info.assignMethod} />
              </div>
              <br />
              <Divider />
              <div className="secondary-text">
                <WarningOutlined style={{ color: 'orange' }} />
                <span style={{ color: 'orange' }}> Warning</span> - Interact with third-party sites at your own risk. This collection will never have
                on-chain approval or transfer transactions.
              </div>
            </div>
          </InformationDisplayCard>
        )}
        <InformationDisplayCard title="Balance Details" md={12} xs={24} sm={24}>
          {<BalancesStorageRow collectionId={collectionId} />}
          {<BalancesUrlRow collectionId={collectionId} />}
          {<BalancesLastUpdatedRow collectionId={collectionId} />}
          {<CanUpdateBalancesUrlRow collectionId={collectionId} badgeId={badgeId} />}

          {isBitBadgesHosted && (
            <TableRow
              labelSpan={24}
              label={
                <>
                  <div className="secondary-text text-left" style={{ fontSize: 14 }}>
                    <InfoCircleOutlined /> BitBadges allows the current manager to update balances as needed.
                  </div>
                </>
              }
              valueSpan={24}
              value={<></>}
            />
          )}

          {<BalanceTypeDescription collectionId={collectionId} />}
        </InformationDisplayCard>
      </div>
    </>
  );
}

export const ClaimCriteriaDisplay = ({
  plugins,
  unknownPublicState
}: {
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  unknownPublicState?: boolean;
}) => {
  return (
    <>
      <ul className="list-disc px-8 " style={{ textAlign: 'left', fontSize: 16 }}>
        {plugins.map((fetchedPlugin) => {
          const plugin = getPlugin(fetchedPlugin.id);
          if (!plugin.detailsString) return null;

          return (
            <li key={plugin.id}>
              <PluginTextDisplay
                pluginId={plugin.id}
                text={plugin.detailsString({
                  id: plugin.id,
                  metadata: plugin.metadata,
                  publicParams: fetchedPlugin.publicParams,
                  publicState: fetchedPlugin.publicState,
                  unknownPublicState: unknownPublicState
                })}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
};

export const ClaimInputs = ({
  claimId,
  plugins,
  docId,
  setOnChainCode,
  onSuccess,
  isPreview
}: {
  claimId: string;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  docId: string;
  setOnChainCode?: (code: string) => void;
  onSuccess?: (recipientAddress: string) => void;
  isPreview?: boolean;
}) => {
  const [customBody, setCustomBody] = useState<any>({});
  const chain = useChainContext();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabledMap, setDisabledMap] = useState<{ [key: string]: string }>({});
  const [stepNum, setStepNum] = useState(1);

  const [selectedAddress, setSelectedAddress] = useState(chain.cosmosAddress);

  const requiresSignIn = plugins.some((x) => x.id === 'requiresProofOfAddress');
  let recipientAddress = requiresSignIn ? chain.cosmosAddress : selectedAddress;

  const fetchCodeForPassword = useCallback(
    async (customBody: object) => {
      const res = await checkAndCompleteClaim(docId, recipientAddress, customBody);
      if (res.code && setOnChainCode) {
        setOnChainCode(res.code);
      }
    },
    [docId, recipientAddress, setOnChainCode]
  );

  const timelineItems = useMemo(() => {
    const preSteps = [];
    if (!requiresSignIn) {
      preSteps.unshift({
        title: 'Address Selection',
        description: '',
        node: () => {
          return (
            <div style={{ textAlign: 'center' }} className="full-width">
              <AddressSelect defaultValue={selectedAddress} onUserSelect={(val) => setSelectedAddress(convertToCosmosAddress(val))} />
            </div>
          );
        },
        disabled: !selectedAddress
      });
    }

    return [
      ...preSteps,
      ...plugins.map((fetchedPlugin) => {
        const plugin = getPlugin(fetchedPlugin.id);
        if (!plugin.inputNode) return EmptyStepItem;

        let node = (
          <div key={plugin.id} className="full-width" style={{ textAlign: 'center' }}>
            {plugin.inputNode({
              disabled: disabledMap[plugin.id],
              setDisabled: (disabled: string) => {
                setDisabledMap((disabledMap) => ({
                  ...disabledMap,
                  [plugin.id]: disabled
                }));
              },
              id: plugin.id,
              metadata: plugin.metadata,
              publicParams: fetchedPlugin.publicParams,
              context: {
                address: recipientAddress,
                claimId: claimId
              },
              publicState: fetchedPlugin.publicState,
              setCustomBody: (pluginBody: object) => {
                setCustomBody({
                  ...customBody,
                  [plugin.id]: pluginBody
                });
              }
            })}
          </div>
        );

        return {
          title: plugin.metadata.name,
          description: '',
          node: () => (
            <>
              {disabledMap[plugin.id] && (
                <>
                  <div className="text-center">{disabledMap[plugin.id] && <ErrDisplay err={disabledMap[plugin.id]} />}</div> <br />
                </>
              )}
              {node}
            </>
          ),
          disabled: !!disabledMap[plugin.id]
        };
      }),
      {
        title: 'Submit',
        description: '',
        node: () => {
          return (
            <div style={{ textAlign: 'center' }} className="full-width">
              <button
                className="landing-button"
                style={{ width: '100%', marginTop: 10 }}
                disabled={success || loading || Object.values(disabledMap).some((x) => x) || isPreview}
                onClick={async () => {
                  setLoading(true);
                  await fetchCodeForPassword(customBody);

                  setSuccess(true);

                  if (onSuccess) {
                    onSuccess(recipientAddress);
                  }

                  setLoading(false);
                }}>
                Check Criteria {setOnChainCode ? '' : 'and Claim'} {loading && <Spin className="px-2" />}
              </button>
              <div style={{ textAlign: 'center' }}>
                <div className="secondary-text">
                  <InfoCircleOutlined /> {`If correct, this will count as your only claim (1 per address).`}
                </div>
              </div>
            </div>
          );
        }
      }
    ];
  }, [
    plugins,
    customBody,
    disabledMap,
    recipientAddress,
    success,
    loading,
    isPreview,
    claimId,
    fetchCodeForPassword,
    setOnChainCode,
    onSuccess,
    requiresSignIn,
    selectedAddress
  ]);

  if (!chain.loggedIn && requiresSignIn) {
    return (
      <div className="flex-center flex-column">
        <BlockinDisplay />
      </div>
    );
  }

  return (
    <>
      <FormTimeline formStepNum={stepNum} setFormStepNum={setStepNum} items={timelineItems} />
    </>
  );
};
