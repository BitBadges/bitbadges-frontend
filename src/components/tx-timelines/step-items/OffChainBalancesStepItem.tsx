import { Col, Divider, Form } from 'antd';
import {
  BalanceArray,
  ClaimIntegrationPluginType,
  IncrementedBalances,
  Metadata,
  NumberType,
  OffChainBalancesMetadataTimeline,
  Transfer,
  TransferWithIncrements,
  UintRangeArray,
  getBalancesAfterTransfers
} from 'bitbadgesjs-sdk';
import { useEffect, useMemo, useState } from 'react';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import crypto from 'crypto';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { MetadataAddMethod } from '../../../bitbadges-api/types';
import { areBalancesBitBadgesHosted } from '../../../bitbadges-api/utils/balances';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { IntegrationPluginDetails, getBlankPlugin, getMaxUses } from '../../../integrations/integrations';
import { BalanceInput } from '../../balances/BalanceInput';
import { ErrDisplay } from '../../common/ErrDisplay';
import { Pagination } from '../../common/Pagination';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { Tabs } from '../../navigation/Tabs';
import { ClaimBuilder } from '../../transfers/ClaimBuilder';
import { TransferSelect } from '../../transfers/TransferOrClaimSelect';
import { getExistingBalanceMap } from '../../tx-modals/UpdateBalancesModal';
import { GenericMarkdownFormInput, GenericTextFormInput } from '../form-items/MetadataForm';
import { UpdateSelectWrapper } from '../form-items/UpdateSelectWrapper';

export interface OffChainClaim<T extends NumberType> {
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  balancesToSet?: IncrementedBalances<T>;
  claimId: string;
}

export const ClaimPaginationWithEditButtons = ({
  claims,
  setClaims,
  idx,
  setIdx,
  total
}: {
  idx: number;
  setIdx: (idx: number) => void;
  total: number;
  claims: OffChainClaim<bigint>[];
  setClaims: (claims: OffChainClaim<bigint>[]) => void;
}) => {
  const offChainClaims = claims;
  const setOffChainClaims = setClaims;

  return (
    <>
      <Pagination
        showOnSinglePage
        currPage={idx + 1}
        onChange={(idx) => {
          setIdx(idx - 1);
        }}
        total={total}
        pageSize={1}
      />
      <div className="flex-center flex-wrap mt-4">
        <IconButton
          src={<DeleteOutlined />}
          onClick={() => {
            setOffChainClaims(offChainClaims.filter((_x, i) => i !== idx));

            setIdx(0);
          }}
          disabled={total == 1}
          tooltipMessage="Remove Claim"
          text="Delete"
        />
        <IconButton
          src={<PlusOutlined />}
          onClick={() => {
            const newIdx = offChainClaims.length;

            setOffChainClaims([
              ...offChainClaims,
              {
                claimId: crypto.randomBytes(32).toString('hex'),
                balancesToSet: new IncrementedBalances<bigint>({
                  startBalances: new BalanceArray(),
                  incrementBadgeIdsBy: 0n,
                  incrementOwnershipTimesBy: 0n
                }),
                plugins: [getBlankPlugin('numUses')]
              }
            ]);

            setIdx(newIdx);
          }}
          text="Add"
          tooltipMessage="Add Claim"
        />
      </div>
    </>
  );
};

export const OffChainClaimBuilder = ({
  collectionId,
  offChainClaims,
  setOffChainClaims,
  setDisabled,
  isUpdateBalancesModal
}: {
  collectionId: bigint;
  offChainClaims: OffChainClaim<bigint>[];
  setOffChainClaims: (offChainClaims: OffChainClaim<bigint>[]) => void;
  isUpdateBalancesModal?: boolean;
  setDisabled: (disabled: boolean) => void;
}) => {
  const collection = useCollection(collectionId);
  const txTimelineContext = useTxTimelineContext();

  const [idx, setIdx] = useState(0);
  const total = offChainClaims.length;

  const [disabledArr, setDisabledArr] = useState<boolean[]>([]);

  useEffect(() => {
    if (!collection) return;

    if (disabledArr.length < collection?.offChainClaims.length) {
      setDisabledArr((disabledArr) => [...disabledArr, ...Array(collection?.offChainClaims.length - disabledArr.length).fill(false)]);
    }

    if (disabledArr.length > collection?.offChainClaims.length) {
      setDisabledArr((disabledArr) => disabledArr.slice(0, collection?.offChainClaims.length));
    }
  }, [collection?.offChainClaims]);

  useEffect(() => {
    setDisabled(disabledArr.some((x) => x));
  }, [disabledArr]);

  if (!collection) return <></>;

  if (!offChainClaims || offChainClaims.length <= idx || !offChainClaims[idx].balancesToSet) {
    return <ErrDisplay err="No claims to set balances for." />;
  }

  const claim = offChainClaims?.[idx];
  const claimBalancesToSet = claim.balancesToSet;
  const plugins = claim.plugins;
  const numRecipients = getMaxUses(plugins);

  console.log(offChainClaims);

  const setClaim = (claim: OffChainClaim<bigint>) => {
    setOffChainClaims(
      offChainClaims.map((x, i) => {
        if (i === idx) {
          return claim;
        }
        return x;
      })
    );
  };

  return (
    <>
      <br />

      <ClaimPaginationWithEditButtons idx={idx} setIdx={setIdx} total={total} claims={offChainClaims} setClaims={setOffChainClaims} />
      {offChainClaims.map((claim, i) => {
        if (i !== idx) return <></>;

        let originalBalances = collection.getBadgeBalances('Total') ?? new BalanceArray();
        for (let j = 0; j < offChainClaims.length; j++) {
          if (j === i) continue;
          originalBalances = getBalancesAfterClaims(originalBalances, [offChainClaims[j]]);
        }

        return (
          <>
            <div className="flex flex-wrap" style={{ alignItems: 'normal' }}>
              <InformationDisplayCard
                md={8}
                xs={24}
                sm={24}
                title="Claim Builder"
                subtitle="Set up criteria for users to meet to claim. Limited to one claim per address.">
                <br />

                <ClaimBuilder
                  type="balances"
                  claim={claim}
                  isUpdate={!!txTimelineContext.existingCollectionId || !!isUpdateBalancesModal}
                  offChainSelect={true}
                  plugins={plugins}
                  setPlugins={(plugins) => {
                    setClaim({
                      ...claim,
                      plugins
                    });
                  }}
                  setDisabled={(disabled) => {
                    setDisabledArr((disabledArr) => {
                      return disabledArr.map((x, j) => (j === idx ? disabled : x));
                    });
                  }}
                />
              </InformationDisplayCard>

              {/* <InformationDisplayCard md={12} xs={24} sm={24} noBorder noPadding inheritBg> */}
              <Col md={16} xs={24} sm={24}>
                {numRecipients == 0 && (
                  <>
                    <ErrDisplay err="Please set the number of recipients (i.e. number of claims)." />
                  </>
                )}
                <BalanceInput
                  suggestedBalances={collection.getBadgeBalances('Total') ?? new BalanceArray()}
                  balancesToShow={claimBalancesToSet?.startBalances ?? new BalanceArray()}
                  onAddBadges={(balance) => {
                    console.log(JSON.stringify(balance));

                    setClaim({
                      ...claim,
                      balancesToSet: new IncrementedBalances<bigint>({
                        incrementBadgeIdsBy: claimBalancesToSet?.incrementBadgeIdsBy ?? 0n,
                        incrementOwnershipTimesBy: claimBalancesToSet?.incrementOwnershipTimesBy ?? 0n,
                        startBalances: BalanceArray.From([balance]).clone()
                      })
                    });
                  }}
                  oneBalanceOnly
                  hideDisplay
                  message="asd"
                  increment={claimBalancesToSet?.incrementBadgeIdsBy ?? 0n}
                  setIncrement={
                    numRecipients > 1n
                      ? (val) => {
                          setClaim({
                            ...claim,
                            balancesToSet: new IncrementedBalances<bigint>({
                              incrementBadgeIdsBy: val,
                              incrementOwnershipTimesBy: claimBalancesToSet?.incrementOwnershipTimesBy ?? 0n,
                              startBalances: claimBalancesToSet?.startBalances ?? new BalanceArray()
                            })
                          });
                        }
                      : undefined
                  }
                  numIncrements={BigInt(numRecipients)}
                  setNumRecipients={
                    numRecipients > 1n
                      ? (val) => {
                          console.log(val);
                          setClaim({
                            ...claim,
                            plugins: claim.plugins.map((x) => {
                              if (x.id === 'numUses') {
                                return {
                                  ...x,
                                  publicParams: {
                                    ...x.publicParams,
                                    maxUses: Number(val)
                                  }
                                };
                              }
                              return x;
                            })
                          });
                        }
                      : undefined
                  }
                  originalBalances={originalBalances}
                />
              </Col>
            </div>
          </>
        );
      })}
    </>
  );
};

export const DistributionComponent = ({
  transfersOverride,
  setTransfersOverride,
  collectionIdOverride
}: {
  transfersOverride?: Array<TransferWithIncrements<bigint>>;
  setTransfersOverride?: (transfers: Array<TransferWithIncrements<bigint>>) => void;
  collectionIdOverride?: bigint;
}) => {
  const collectionId = collectionIdOverride ?? NEW_COLLECTION_ID;
  const collection = useCollection(collectionIdOverride ?? NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const transfers = transfersOverride ?? txTimelineContext.transfers;
  const setTransfers = setTransfersOverride ?? txTimelineContext.setTransfers;

  if (!collection) return <></>;

  return (
    <div>
      <br />
      <div className="">
        <TransferSelect
          collectionId={collectionId}
          sender={'Mint'}
          originalSenderBalances={collection.getBadgeBalances('Total') ?? new BalanceArray()} //We use total balances and allow them to fetch currently minted
          setTransfers={(transfers) => {
            if (transfers.length > 15000) {
              alert('Too many transfers. Please keep under 15000.');
              return;
            }

            setTransfers(transfers);
          }}
          transfers={transfers}
          plusButton
          fetchExisting={
            !!collectionId && collectionId > 0n && collection.offChainBalancesMetadataTimeline.length > 0
              ? async () => {
                  const balancesMap = await getExistingBalanceMap(collection);
                  const transfers: Array<Transfer<bigint>> = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
                    return new Transfer<bigint>({
                      from: 'Mint',
                      toAddresses: [cosmosAddress],
                      balances
                    });
                  });
                  setTransfers(transfers);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};

export const getBalancesAfterClaims = (originalBalances: BalanceArray<bigint>, claims: Array<OffChainClaim<bigint>>): BalanceArray<bigint> => {
  if (!claims || claims.length == 0) return new BalanceArray();

  let balances = originalBalances.clone();
  for (const claim of claims) {
    const claimBalancesToSet =
      claim?.balancesToSet ??
      new IncrementedBalances<bigint>({ startBalances: new BalanceArray(), incrementBadgeIdsBy: 0n, incrementOwnershipTimesBy: 0n });
    const numRecipients = getMaxUses(claim.plugins);

    balances = getBalancesAfterTransfers(
      balances,
      [
        new TransferWithIncrements({
          from: 'Mint',
          toAddresses: [],
          toAddressesLength: BigInt(numRecipients),
          balances: claimBalancesToSet.startBalances,
          incrementBadgeIdsBy: claimBalancesToSet.incrementBadgeIdsBy,
          incrementOwnershipTimesBy: claimBalancesToSet.incrementOwnershipTimesBy
        })
      ],
      true
    );
  }
  return balances;
};

// This is the first custom step in the off-chain balances creation flow. It allows the user to select between
// uploading metadata themselves or having it outsourced. It uses the SwitchForm component to render the options.
export function OffChainBalancesStorageSelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const existingCollection = useCollection(existingCollectionId);
  const canUpdateOffChainBalancesMetadata = txTimelineContext.updateOffChainBalancesMetadataTimeline;
  const setCanUpdateOffChainBalancesMetadata = txTimelineContext.setUpdateOffChainBalancesMetadataTimeline;

  const addMethod = txTimelineContext.offChainAddMethod;
  const setAddMethod = txTimelineContext.setOffChainAddMethod;

  const [disabled, setDisabled] = useState(false);

  const [uri, setUri] = useState('');
  const [err, setErr] = useState<Error | null>(null);

  const DELAY_MS = 200;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!uri) {
        console.log('no badge uri or collection');
        return;
      }

      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainBalancesMetadataTimeline: [
          new OffChainBalancesMetadataTimeline({
            timelineTimes: UintRangeArray.FullRanges(),
            offChainBalancesMetadata: {
              uri: uri,
              customData: ''
            }
          })
        ]
      });
    }, DELAY_MS);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [uri]);

  const offChainClaims = collection?.offChainClaims;
  const balancesAfterClaims = useMemo(() => {
    if (!offChainClaims || offChainClaims.length == 0) return new BalanceArray();
    return getBalancesAfterClaims(collection.getBadgeBalances('Total') ?? new BalanceArray(), offChainClaims);
  }, [collection, offChainClaims]);

  const hasLeftover = offChainClaims && offChainClaims.length > 0 && balancesAfterClaims.some((x) => BigInt(x.amount) > 0n);
  const underflows = offChainClaims && offChainClaims.length > 0 && balancesAfterClaims.some((x) => BigInt(x.amount) < 0n);

  useEffect(() => {
    txTimelineContext.setTransfers([]);
    if (!collection || collection.balancesType === 'Standard' || collection.balancesType === 'Off-Chain - Non-Indexed') return;

    const tab = addMethod === MetadataAddMethod.Manual ? 'manual' : addMethod === MetadataAddMethod.Plugins ? 'plugins' : 'upload';

    if (tab === 'plugins' || tab === 'manual') {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainBalancesMetadataTimeline: existingCollection
          ? isBitBadgesHosted
            ? existingCollection.offChainBalancesMetadataTimeline
            : [
                new OffChainBalancesMetadataTimeline({
                  timelineTimes: UintRangeArray.FullRanges(),
                  offChainBalancesMetadata: {
                    uri: 'bitbadges-hosted', //something different so it triggers the validateUpdate (not bitbadges hosted -> bitbadges hosted will change URL)
                    customData: ''
                  }
                })
              ]
          : []
      });
    }

    if (tab === 'manual') {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainClaims: []
      });
    } else if (tab === 'plugins') {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainClaims:
          (txTimelineContext.startingCollection?.offChainClaims ?? []).length > 0
            ? txTimelineContext.startingCollection?.offChainClaims
            : [
                {
                  claimId: crypto.randomBytes(32).toString('hex'),
                  balancesToSet: new IncrementedBalances({
                    startBalances: new BalanceArray(),
                    incrementBadgeIdsBy: 0n,
                    incrementOwnershipTimesBy: 0n
                  }),
                  plugins: [getBlankPlugin('numUses'), getBlankPlugin('requiresProofOfAddress')]
                }
              ]
      });
    } else {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        offChainBalancesMetadataTimeline: [
          new OffChainBalancesMetadataTimeline({
            timelineTimes: UintRangeArray.FullRanges(),
            offChainBalancesMetadata: {
              uri: uri,
              customData: ''
            }
          })
        ],
        offChainClaims: []
      });
    }
  }, [addMethod]);

  if (!collection) return EmptyStepItem;

  const isBitBadgesHosted = areBalancesBitBadgesHosted(existingCollection);

  const Component = () => (
    <>
      <br />
      <div className="flex-center full-width">
        <Tabs
          style={{ marginLeft: 8, marginRight: 8 }}
          fullWidth
          tab={addMethod === MetadataAddMethod.Manual ? 'manual' : addMethod === MetadataAddMethod.Plugins ? 'plugins' : 'upload'}
          setTab={(tab) => {
            if (!collection) return;

            if (tab === 'manual') {
              setAddMethod(MetadataAddMethod.Manual);
            } else if (tab === 'plugins') {
              setAddMethod(MetadataAddMethod.Plugins);
            } else {
              setAddMethod(MetadataAddMethod.UploadUrl);
            }
          }}
          tabInfo={[
            {
              key: 'upload',
              content: 'Self-Hosted'
            },
            {
              key: 'manual',
              content: 'Manual'
            },
            {
              key: 'plugins',
              content: 'Claims'
            }
          ]}
        />
      </div>

      <div className="flex-center flex-column secondary-text" style={{ marginTop: 8 }}>
        {addMethod === MetadataAddMethod.UploadUrl && 'Store and host the balances yourself. Provide a URL to where it is hosted.'}
        {addMethod === MetadataAddMethod.Manual &&
          'Manually assign the badges yourself. The current manager will be able to update in the future (if permissions allow).'}
        {addMethod === MetadataAddMethod.Plugins &&
          'Allow users to claim if they meet the criteria. The current manager will be able to update in the future (if permissions allow).'}
      </div>

      {addMethod === MetadataAddMethod.Manual && <>{<DistributionComponent />}</>}
      {addMethod === MetadataAddMethod.Plugins && collection.offChainClaims.length > 0 && (
        <>
          <br />
          {underflows && (
            <>
              <ErrDisplay err="The balances you are allocating will exceed the total supply." />
              <br />
            </>
          )}

          {hasLeftover && !underflows && (
            <>
              <ErrDisplay warning err="The balances you are allocating will result in leftover balances." />
              <br />
            </>
          )}

          <OffChainClaimBuilder
            collectionId={collection.collectionId}
            offChainClaims={collection.offChainClaims}
            setOffChainClaims={(newClaims) => {
              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                offChainClaims: newClaims.map((x) => {
                  return {
                    ...x,
                    balancesToSet:
                      x.balancesToSet ??
                      new IncrementedBalances<bigint>({
                        startBalances: new BalanceArray(),
                        incrementBadgeIdsBy: 0n,
                        incrementOwnershipTimesBy: 0n
                      })
                  };
                })
              });
            }}
            setDisabled={setDisabled}
          />
        </>
      )}
      {addMethod === MetadataAddMethod.UploadUrl && (
        <>
          <br />
          <GenericTextFormInput required label="Balances URI" value={uri} setValue={setUri} />
          <Divider />
          {txTimelineContext.collectionAddMethod === MetadataAddMethod.UploadUrl && txTimelineContext.updateCollectionMetadataTimeline && (
            <>
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                <InfoCircleOutlined />{' '}
                {'To provide additional transferability info, you can host it at the self-hosted URL of your collection metadata.'} See{' '}
                <a href="https://app.gitbook.com/o/7VSYQvtb1QtdWFsEGoUn/s/7R34Y0QZwgpUGaJnJ4dq/for-developers/core-concepts/metadata" target="_blank">
                  here
                </a>{' '}
                for more info.
              </div>
            </>
          )}
          {txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateCollectionMetadataTimeline && (
            <OffChainTransferabilityMetadataSelect collectionId={collection.collectionId} />
          )}
          {!txTimelineContext.updateCollectionMetadataTimeline && (
            <>
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                <InfoCircleOutlined /> {'To edit the transferability metadata, you cannot have collection metadata set to "Do not update".'}
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  return {
    title: 'Off-Chain Balances',
    description: `For off-chain balances, you are responsible for assigning who owns what badges. This is done off-chain, so this will not add to your on-chain transaction fee.`,
    node: () => (
      <>
        <UpdateSelectWrapper
          documentationLink={'https://docs.bitbadges.io/overview/how-it-works/balances-types'}
          err={err}
          setErr={(err) => {
            setErr(err);
          }}
          updateFlag={canUpdateOffChainBalancesMetadata}
          setUpdateFlag={setCanUpdateOffChainBalancesMetadata}
          jsonPropertyPath="offChainBalancesMetadataTimeline"
          permissionName="canUpdateOffChainBalancesMetadata"
          disableJson
          node={Component}
        />
      </>
    ),
    disabled:
      addMethod === MetadataAddMethod.None ||
      !!err ||
      disabled ||
      (addMethod === MetadataAddMethod.Plugins &&
        (collection.offChainClaims.length === 0 || collection.offChainClaims.some((x) => x.plugins.length === 0))) ||
      (addMethod === MetadataAddMethod.Plugins && underflows) ||
      (addMethod === MetadataAddMethod.Plugins &&
        (collection.offChainClaims.length === 0 ||
          collection.offChainClaims.some((x) => !x.balancesToSet || x.balancesToSet.startBalances.length === 0))) ||
      (addMethod === MetadataAddMethod.UploadUrl && !uri)
  };
}

export const OffChainTransferabilityMetadataSelect = ({ collectionId }: { collectionId: bigint }) => {
  const collection = useCollection(collectionId);

  const host = collection?.cachedCollectionMetadata?.offChainTransferabilityInfo?.host ?? '';
  const assignMethod = collection?.cachedCollectionMetadata?.offChainTransferabilityInfo?.assignMethod ?? '';

  const setHost = (host: string) => {
    if (!collection?.cachedCollectionMetadata) return;

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedCollectionMetadata: new Metadata({
        ...collection.cachedCollectionMetadata,
        offChainTransferabilityInfo: {
          host,
          assignMethod: collection.cachedCollectionMetadata.offChainTransferabilityInfo?.assignMethod ?? ''
        }
      })
    });
  };

  const setAssignMethod = (assignMethod: string) => {
    if (!collection?.cachedCollectionMetadata) return;

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedCollectionMetadata: new Metadata({
        ...collection.cachedCollectionMetadata,
        offChainTransferabilityInfo: {
          host: collection.cachedCollectionMetadata.offChainTransferabilityInfo?.host ?? '',
          assignMethod
        }
      })
    });
  };

  return (
    <>
      <div
        className="full-width"
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
        <Form colon={false} layout="vertical" className="full-width">
          <GenericMarkdownFormInput
            label="Host"
            value={host}
            setValue={setHost}
            placeholder={`Provide a brief description of where the balances are hosted (i.e. decentralized? who controls it?)`}
            height={200}
          />
          <GenericMarkdownFormInput
            label="Assignment"
            value={assignMethod}
            setValue={setAssignMethod}
            placeholder={`How are balances assigned?`}
            height={200}
          />
        </Form>
      </div>
    </>
  );
};
