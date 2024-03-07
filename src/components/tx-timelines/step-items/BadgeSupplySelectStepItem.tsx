import { Divider, Switch } from 'antd';
import { BadgeMetadataDetails, BalanceArray, BalancesActionPermission, Metadata, UintRangeArray, UserBalanceStoreWithDetails } from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Balance } from 'bitbadgesjs-sdk';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { BalanceInput } from '../../balances/BalanceInput';
import { SupplyAndOwnersCard } from '../../collection-page/OverviewTab';
import { DevMode } from '../../common/DevMode';
import { BadgeIdRangesInput } from '../../inputs/BadgeIdRangesInput';
import { UpdateSelectWrapper } from '../form-items/UpdateSelectWrapper';

const { removeBadgeMetadata, updateBadgeMetadata } = BadgeMetadataDetails;

export function BadgeSupplySelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const badgesToCreate = txTimelineContext.badgesToCreate;
  const setBadgesToCreate = txTimelineContext.setBadgesToCreate;

  const balancesToShow = collection?.getBadgeBalances('Total') || new BalanceArray<bigint>();
  const [err, setErr] = useState<Error | null>(null);
  const [limitedSupply, setLimitedSupply] = useState<boolean>(collection?.defaultBalances.balances.length === 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(!txTimelineContext.existingCollectionId);

  const revertFunction = () => {
    if (!collection) return;

    const prevNumberOfBadges = startingCollection ? startingCollection.getMaxBadgeId() : 0n;

    const newBadgeMetadata = removeBadgeMetadata(
      collection.cachedBadgeMetadata.map((x) => x.clone()),
      UintRangeArray.From([
        {
          start: prevNumberOfBadges + 1n,
          end: collection.getMaxBadgeId()
        }
      ])
    );

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata,
      defaultBalances: collection?.defaultBalances
        ? new UserBalanceStoreWithDetails({
            ...collection.defaultBalances,
            balances: []
          })
        : undefined
    });

    setBadgesToCreate(new BalanceArray<bigint>());
  };

  const isNonIndexed = collection?.balancesType == 'Off-Chain - Non-Indexed';

  const onAddBadges = (balance: Balance<bigint>, reset?: boolean) => {
    if (!collection) return;
    const currBadgesToCreate = reset ? new BalanceArray<bigint>() : badgesToCreate.clone();
    const newBadgesToCreate = currBadgesToCreate.clone().addBalance(balance);
    const prevNumberOfBadges = startingCollection ? startingCollection.getMaxBadgeId() : 0n;

    const maxBadgeIdAdded =
      UintRangeArray.From(newBadgesToCreate.map((x) => x.badgeIds).flat())
        .sortAndMerge()
        .pop()?.end || 0n;
    const newBadgeMetadata = updateBadgeMetadata(
      collection.cachedBadgeMetadata.map((x) => x.clone()),
      new BadgeMetadataDetails<bigint>({
        metadata: Metadata.DefaultPlaceholderMetadata(),
        badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }]
      })
    );

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata
    });

    setBadgesToCreate(newBadgesToCreate);
  };

  const onAddStartBalances = (balance: Balance<bigint>) => {
    if (!collection) return;
    const currBadgesToCreate = collection.defaultBalances.balances.clone();
    currBadgesToCreate.push(balance);
    const newBadgesToCreate = currBadgesToCreate.clone();
    const prevNumberOfBadges = startingCollection ? startingCollection.getMaxBadgeId() : 0n;
    const maxBadgeIdAdded =
      UintRangeArray.From(newBadgesToCreate.map((x) => x.badgeIds).flat())
        .sortAndMerge()
        .pop()?.end || 0n;

    const newBadgeMetadata = updateBadgeMetadata(
      collection.cachedBadgeMetadata.map((x) => x.clone()),
      new BadgeMetadataDetails<bigint>({
        metadata: Metadata.DefaultPlaceholderMetadata(),
        badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }]
      })
    );

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata
    });

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      defaultBalances: new UserBalanceStoreWithDetails({
        ...collection.defaultBalances,
        balances: newBadgesToCreate
      })
    });
  };

  if (txTimelineContext.existingCollectionId && txTimelineContext.existingCollectionId > 0n) {
    if ((collection?.defaultBalances.balances.length ?? 0) > 0) {
      return EmptyStepItem; //cant update defaults anymore
    }
  }

  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');
  const isCreateTx = !existingCollectionId;

  const SuggestedEmptyBalances = BalanceArray.From([
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 10n }],
      ownershipTimes: UintRangeArray.FullRanges()
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 100n }],
      ownershipTimes: UintRangeArray.FullRanges()
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 1000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 10000n }],
      ownershipTimes: UintRangeArray.FullRanges()
    }
  ]);

  return {
    title: `Circulating Supplys`,
    description:
      isNonIndexed || noBalancesStandard
        ? 'Define the number of unique badges for your collection.'
        : 'Define the circulating supplys for badges in your collection. You can customize and distribute these badges in later steps.',
    node: () => (
      <UpdateSelectWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/total-supplys"
        err={err}
        setErr={(err) => {
          setErr(err);
        }}
        doNotUpdateNode={() => (
          <div
            className="flex-center"
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <SupplyAndOwnersCard collectionId={NEW_COLLECTION_ID} md={24} badgeId={undefined} isSelectStep={true} />
          </div>
        )}
        updateFlag={updateFlag}
        setUpdateFlag={setUpdateFlag}
        jsonPropertyPath={limitedSupply ? 'badgesToCreate' : ''}
        permissionName="canCreateMoreBadges"
        customRevertFunction={revertFunction}
        node={() => (
          <div
            className="primary-text"
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {(isNonIndexed || noBalancesStandard) && (
              <div
                className="flex-center flex-column"
                style={{
                  textAlign: 'center',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <BadgeIdRangesInput
                  collectionId={NEW_COLLECTION_ID}
                  suggestedRanges={
                    badgesToCreate.length > 0
                      ? UintRangeArray.From(badgesToCreate.map((x) => x.badgeIds).flat())
                      : UintRangeArray.From(
                          SuggestedEmptyBalances.clone()
                            .map((x) => x.badgeIds)
                            .flat()
                        )
                  }
                  uintRanges={UintRangeArray.From(badgesToCreate.map((x) => x.badgeIds).flat())}
                  setUintRanges={(uintRanges) => {
                    if (!collection) return;

                    onAddBadges(
                      new Balance<bigint>({
                        badgeIds: uintRanges,
                        ownershipTimes: UintRangeArray.FullRanges(),
                        amount: 1n
                      }),
                      true
                    );
                  }}
                />
              </div>
            )}
            {!isNonIndexed && !noBalancesStandard && (
              <>
                <div
                  className="flex-center"
                  style={{
                    textAlign: 'center',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <SupplyAndOwnersCard collectionId={NEW_COLLECTION_ID} md={12} badgeId={undefined} isSelectStep={true} />
                </div>
                <br />
                {collection?.balancesType === 'Standard' && isCreateTx && (
                  <>
                    <Switch
                      checkedChildren="Defined Supply"
                      unCheckedChildren="Start Balances"
                      checked={limitedSupply}
                      onChange={(checked) => {
                        setLimitedSupply(checked);
                        txTimelineContext.setTransfers([]);
                        if (checked) {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            defaultBalances: collection?.defaultBalances
                              ? new UserBalanceStoreWithDetails({
                                  ...collection.defaultBalances,
                                  balances: []
                                })
                              : undefined,
                            collectionPermissions: {
                              ...collection?.collectionPermissions,
                              canCreateMoreBadges: []
                            }
                          });
                        } else {
                          revertFunction();
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            collectionPermissions: {
                              ...collection?.collectionPermissions,
                              canCreateMoreBadges: [
                                new BalancesActionPermission({
                                  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                                  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                                  permanentlyPermittedTimes: [],
                                  permanentlyForbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
                                })
                              ]
                            }
                          });
                        }
                      }}
                    />
                    <br />
                    <br />
                    <div className="flex-center">
                      <div
                        className="secondary-text"
                        style={{
                          textAlign: 'center',
                          justifyContent: 'center',
                          alignItems: 'center',
                          maxWidth: 800
                        }}>
                        <InfoCircleOutlined style={{ marginRight: 4 }} />{' '}
                        {limitedSupply
                          ? `Set the circulating supplys for badges in your collection. Created badges will initially be sent to the Mint address.
        Every transfer requires a blockchain transaction that satisifies the approval requirements for the collection, sender, and recipient. This is the recommended option.`
                          : `ALL addresses will be given a predefined balance of badges upon first interaction with this collection. For example, all addresses start with x1 of ID 1. Because there is no limit on addresses that can be created, note that there is potentially an infinite supply of badges.`}
                      </div>
                    </div>
                  </>
                )}
                {((collection?.balancesType === 'Standard' && limitedSupply) || collection?.balancesType !== 'Standard' || !isCreateTx) && (
                  <>
                    <BalanceInput
                      sequentialOnly
                      balancesToShow={balancesToShow}
                      onAddBadges={(balance) => {
                        onAddBadges(balance);
                      }}
                      hideDisplay
                      message="Circulating Supplys"
                      onRemoveAll={revertFunction}
                      suggestedBalances={badgesToCreate.length > 0 ? badgesToCreate : SuggestedEmptyBalances.clone()}
                    />
                    <Divider />
                    <DevMode obj={badgesToCreate} />
                  </>
                )}
                {collection?.balancesType === 'Standard' && !limitedSupply && isCreateTx && (
                  <>
                    <BalanceInput
                      sequentialOnly
                      balancesToShow={collection?.defaultBalances.balances ?? []}
                      onAddBadges={(balance) => {
                        onAddStartBalances(balance);
                      }}
                      hideDisplay
                      message="Start Balances"
                      onRemoveAll={() => {
                        updateCollection({
                          collectionId: NEW_COLLECTION_ID,
                          defaultBalances: collection?.defaultBalances
                            ? new UserBalanceStoreWithDetails({
                                ...collection.defaultBalances,
                                balances: []
                              })
                            : undefined
                        });
                      }}
                      suggestedBalances={
                        collection.defaultBalances.balances.length > 0 ? collection.defaultBalances.balances : SuggestedEmptyBalances.clone()
                      }
                    />
                    <Divider />
                    <DevMode obj={collection?.defaultBalances.balances} />
                  </>
                )}
              </>
            )}
          </div>
        )}
      />
    ),
    disabled:
      (!existingCollectionId && !limitedSupply && collection?.defaultBalances.balances.length == 0) ||
      (!existingCollectionId && limitedSupply && badgesToCreate?.length == 0) ||
      !!err
  };
}
