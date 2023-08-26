import { Col, Row, Typography } from "antd";
import { AddressMapping, MustOwnBadges } from "bitbadgesjs-proto";
import { ApprovedTransferPermissionUsedFlags, castCollectionApprovedTransferPermissionToUniversalPermission, convertToCosmosAddress, getReservedAddressMapping, validateCollectionApprovedTransfersUpdate } from "bitbadgesjs-utils";
import { useEffect, useRef, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { useStatusContext } from "../../../bitbadges-api/contexts/StatusContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { AddressListSelect } from "../../address/AddressListSelect";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { NumberInput } from "../../display/NumberInput";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { BalanceInput } from "../form-items/BalanceInput";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const crypto = require('crypto');

export function TransferabilitySelectStepItem(
  updateCollectionApprovedTransfers: boolean,
  setUpdateCollectionApprovedTransfers: (val: boolean) => void,

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const status = useStatusContext();

  const [mustOwnBadges, setMustOwnBadges] = useState<MustOwnBadges<bigint>[]>([]);
  const [collectionId, setCollectionId] = useState<bigint>(1n);
  const [frozenUsers, setFrozenUsers] = useState<string[]>([]);
  const [clicked, setClicked] = useState<boolean>(false);

  const approvalId = useRef(crypto.randomBytes(32).toString('hex'));
  useEffect(() => {
    if (!collection) return;

    const newApprovedTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" || x.initiatedByMappingId === "Manager");

    for (const user of frozenUsers) {
      newApprovedTransfers.push({
        toMappingId: "AllWithoutMint",
        fromMappingId: convertToCosmosAddress(user),
        initiatedByMappingId: "AllWithoutMint",
        badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
        ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        fromMapping: getReservedAddressMapping(convertToCosmosAddress(user), '') as AddressMapping,
        toMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
        initiatedByMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
        approvalDetails: [],
        transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        allowedCombinations: [{
          isApproved: false,
          toMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          fromMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },

          initiatedByMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          badgeIdsOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          ownershipTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          transferTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
        }]

      });

      newApprovedTransfers.push({
        fromMappingId: "AllWithoutMint",
        toMappingId: convertToCosmosAddress(user),
        initiatedByMappingId: "AllWithoutMint",
        badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
        ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        toMapping: getReservedAddressMapping(convertToCosmosAddress(user), '') as AddressMapping,
        fromMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
        initiatedByMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
        approvalDetails: [],
        transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        allowedCombinations: [{
          isApproved: false,
          toMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          fromMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },

          initiatedByMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          badgeIdsOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          ownershipTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          transferTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
        }]

      });

    }

    newApprovedTransfers.push({
      fromMappingId: "AllWithoutMint",
      toMappingId: "AllWithoutMint",
      initiatedByMappingId: "AllWithoutMint",
      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      toMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
      fromMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
      initiatedByMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
      approvalDetails: mustOwnBadges && mustOwnBadges.length > 0 ?
        [{
          approvalId: approvalId.current,
          uri: '',
          customData: '',
          mustOwnBadges: mustOwnBadges,
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
          merkleChallenges: [], //handled later
          requireToEqualsInitiatedBy: false,
          requireFromEqualsInitiatedBy: false,
          requireToDoesNotEqualInitiatedBy: false,
          requireFromDoesNotEqualInitiatedBy: false,


          overridesToApprovedIncomingTransfers: false,
          overridesFromApprovedOutgoingTransfers: false,
        }]

        : [], //no restrictions
      transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      allowedCombinations: [{
        isApproved: true,
        toMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        fromMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },

        initiatedByMappingOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        badgeIdsOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        ownershipTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        transferTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
      }]

    });

    collections.updateCollection({
      ...collection,
      collectionApprovedTransfersTimeline: [{
        collectionApprovedTransfers: newApprovedTransfers,
        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      }]
    });
  }, [mustOwnBadges, frozenUsers]);
  if (!collection) return EmptyStepItem;

  // const approvedTransfers = collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []
  // const lastElement = approvedTransfers.length > 0 ? approvedTransfers[approvedTransfers.length - 1] : undefined;

  //Hardcoded and naive
  const filteredApprovedTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" || x.initiatedByMappingId === "Manager");


  const transferableLength = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).length - filteredApprovedTransfers.length;
  const transferable = transferableLength > 0;


  const err = existingCollection ? validateCollectionApprovedTransfersUpdate(existingCollection.collectionApprovedTransfersTimeline, collection.collectionApprovedTransfersTimeline, existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers) : undefined;

  // let details: UniversalPermissionDetails[] = [];
  // //Currently hardcoded and programmed to only handle [] or [value forever]; no custom 
  // if (collection) {

  //   const existingTranferability: CollectionApprovedTransferTimelineWithDetails<bigint>[] = [];
  //   const newMetadata = collection.collectionApprovedTransfersTimeline;
  //   console.log(newMetadata, existingTranferability);
  //   if (JSON.stringify(existingTranferability) !== JSON.stringify(newMetadata)) {
  //     details.push({
  //       timelineTime: { start: 1n, end: GO_MAX_UINT_64 },

  //       badgeId: { start: -1n, end: -1n },
  //       ownershipTime: { start: -1n, end: -1n },
  //       transferTime: { start: -1n, end: -1n },
  //       toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
  //       permittedTimes: [],
  //       forbiddenTimes: [],
  //       arbitraryValue: undefined
  //     });
  //   } else {
  //     equalsExisting = true;
  //   }
  // }

  // const permissions: CollectionApprovedTransferPermissionWithDetails<bigint>[] = [{
  //   defaultValues: {
  //     timelineTimes: [],
  //     ownershipTimes: [],
  //     transferTimes: [],
  //     fromMappingId: 'All',
  //     toMappingId: 'All',
  //     initiatedByMappingId: 'All',
  //     fromMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     toMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     initiatedByMapping: getReservedAddressMapping("All", '') as AddressMapping,
  //     forbiddenTimes: [],
  //     permittedTimes: [],
  //     badgeIds: [],
  //   },
  //   combinations: [{
  //     badgeIdsOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     timelineTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     forbiddenTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     permittedTimesOptions: {
  //       invertDefault: false,
  //       allValues: false,
  //       noValues: false,
  //     },
  //     fromMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     toMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     initiatedByMappingOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     transferTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     ownershipTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //   }]
  // }];

  // const err = details.length > 0 ? checkCollectionApprovedTransferPermission(details, permissions) : undefined;


  return {
    title: `Select Transferability`,
    // description: 
    description: <>{`Once badges are into a user's wallet, should they be transferable or non-transferable?`}
      <br /><br />
      {existingCollectionId ? <> {`Current Permission - Can Update Transferability?: `}
        {
          PermissionIcon(
            castCollectionApprovedTransferPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []), '', ApprovedTransferPermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovedTransfers}
      setUpdateFlag={setUpdateCollectionApprovedTransfers}
      existingCollectionId={existingCollectionId}
      node={


        <div className="priamry-text">

          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>{err.message}
              <br />
              <p>Please resolve this error before continuing.</p>
              <br />
              <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

            </div>}

          <SwitchForm
            // noSelectUntilClick
            options={[
              {
                title: 'Non-Transferable',
                message: `Badges will be non-transferable.`,
                isSelected: !transferable
              },
              {
                title: 'Transferable',
                message: `Badges will be transferable.`,
                isSelected: transferable && transferableLength === 1
              },
              // {
              //TODO:
              //   title: 'Custom',
              //   disabled: true,
              //   message: `Custom transferability is selected.`,
              //   isSelected: transferable && transferableLength > 1
              // },
            ]}
            onSwitchChange={(idx) => {
              setClicked(true);
              const newApprovedTransfers = (collection?.collectionApprovedTransfersTimeline.find(x => x.collectionApprovedTransfers)?.collectionApprovedTransfers ?? []).filter(x => x.fromMappingId === "Mint" || x.initiatedByMappingId === "Manager");

              if (idx === 1) {
                newApprovedTransfers.push({
                  fromMappingId: "AllWithoutMint",
                  toMappingId: "AllWithoutMint",
                  initiatedByMappingId: "AllWithoutMint",
                  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  toMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  fromMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  initiatedByMapping: getReservedAddressMapping("AllWithoutMint", '') as AddressMapping,
                  approvalDetails: [], //no restrictions
                  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  allowedCombinations: [{
                    isApproved: true,
                    toMappingOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },
                    fromMappingOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },

                    initiatedByMappingOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },
                    badgeIdsOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },
                    ownershipTimesOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },
                    transferTimesOptions: {
                      invertDefault: false,
                      allValues: false,
                      noValues: false
                    },
                  }]

                });
              }

              collections.updateCollection({
                ...collection,
                collectionApprovedTransfersTimeline: [{
                  collectionApprovedTransfers: newApprovedTransfers,
                  timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                }]
              });
            }}
          />
          <br />
          {transferable && clicked && <>
            <div style={{ textAlign: 'center' }}>
              <Typography.Text strong className="primary-text" style={{ fontSize: 18, textAlign: 'center' }}>{"Additional Restrictions?"}</Typography.Text>
            </div>
            <br />
            <Row className='full-width primary-text' style={{ textAlign: 'center' }}>
              <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 10, paddingRight: 10, }}>
                <InformationDisplayCard
                  title={<>Must Own Badges</>}
                // noBorder
                >
                  <div className='primary-text'>


                    <br />
                    <div style={{ textAlign: 'center' }}>
                      <b style={{ textAlign: 'center' }}>{"Select badges that the initiator of a transfer must own at the time of transfer."}</b>
                    </div>
                    <br />
                    <br />

                    <NumberInput

                      title="Collection ID"
                      value={Number(collectionId)}
                      setValue={(val) => setCollectionId(BigInt(val))}
                      min={1}
                      max={Number(status.status.nextCollectionId) - 1}
                    // max={Number.MAX_SAFE_INTEGER}
                    />
                    <br />
                    <br />
                    <BalanceInput
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
                      onAddBadges={(balance) => {
                        setMustOwnBadges([...mustOwnBadges, {
                          collectionId: collectionId,
                          overrideWithCurrentTime: true,
                          amountRange: { start: balance.amount, end: balance.amount },
                          badgeIds: balance.badgeIds,
                          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        }]);
                      }}
                      onRemoveAll={() => {
                        setMustOwnBadges([]);
                      }}
                      // setBalances={setBalances}
                      collectionId={collectionId}
                    />
                  </div>
                </InformationDisplayCard>
              </Col>
              <Col md={0} xs={24} style={{ height: 30 }} />
              <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 10, paddingRight: 10, }}>
                <InformationDisplayCard
                  title={<>Frozen Addresses</>}
                // noBorder
                >
                  <div className='primary-text'>


                    <br />
                    <div style={{ textAlign: 'center' }}>
                      <b style={{ textAlign: 'center' }}>{"Select addresses that cannot transfer."}</b>
                    </div>
                    <br />
                    <AddressListSelect
                      users={frozenUsers}
                      setUsers={setFrozenUsers}
                      hideAddresses
                    />
                    <br />

                    <AddressDisplayList
                      users={frozenUsers}
                    />


                  </div>

                </InformationDisplayCard>
              </Col>
            </Row>
          </>}
        </div >
      }
    />,
    disabled: !!err,
  }
}