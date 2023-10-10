import { Col, Divider, Row, Typography } from "antd";
import { AddressMapping, MustOwnBadges, deepCopy } from "bitbadgesjs-proto";
import { ApprovalPermissionUsedFlags, castCollectionApprovalPermissionToUniversalPermission, convertToCosmosAddress, getReservedAddressMapping, validateCollectionApprovalsUpdate } from "bitbadgesjs-utils";
import { useEffect, useRef, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { useStatusContext } from "../../../bitbadges-api/contexts/StatusContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { AddressListSelect } from "../../address/AddressListSelect";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { BalanceInput } from "../../inputs/BalanceInput";
import { NumberInput } from "../../inputs/NumberInput";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { approvalCriteriaHasNoRestrictions } from "../../../bitbadges-api/utils/claims";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";

const crypto = require('crypto');

export function TransferabilitySelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;
  const approvalsToAdd = txTimelineContext.approvalsToAdd;
  const chain = useChainContext();

  const status = useStatusContext();

  const [mustOwnBadges, setMustOwnBadges] = useState<MustOwnBadges<bigint>[]>([]);
  const [collectionId, setCollectionId] = useState<bigint>(1n);
  const [frozenUsers, setFrozenUsers] = useState<string[]>([]);
  const [clicked, setClicked] = useState<boolean>(false);
  const [revokable, setRevokable] = useState<boolean>(false);
  const [showAdditional, setShowAdditional] = useState<boolean>(false);
  const [defaultTransferable, setDefaultTransferable] = useState<boolean>(false);

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));
  const manager = collection?.managerTimeline.find(x => x.manager)?.manager ?? '';

  useEffect(() => {
    if (!collection || !clicked || !showAdditional) return;

    handleClick(false, false)
  }, [mustOwnBadges, frozenUsers, defaultTransferable, revokable, showAdditional, manager]);

  if (!collection) return EmptyStepItem;

  //This is still naive in the fact that it includes "Mint"+ mappings but works for nonTransferable / transfeerable vars
  const nonMintApprovals = getNonMintApprovals(collection, false);
  const nonTransferable = nonMintApprovals.length == 0;
  const transferable = nonMintApprovals.length > 0 && nonMintApprovals.every(x => approvalCriteriaHasNoRestrictions(x.approvalCriteria));

  const handleClick = (nonTransferable: boolean, transferable: boolean) => {
    if (!collection) return;

    const newApprovals = getMintApprovals(collection);

    if (nonTransferable) {

    } else if (transferable) {
      newApprovals.push({
        fromMappingId: "AllWithoutMint",
        toMappingId: "AllWithoutMint",
        initiatedByMappingId: "AllWithoutMint",
        badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
        ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        toMapping: getReservedAddressMapping("AllWithoutMint") as AddressMapping,
        fromMapping: getReservedAddressMapping("AllWithoutMint") as AddressMapping,
        initiatedByMapping: getReservedAddressMapping("AllWithoutMint") as AddressMapping,
        transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        approvalId: "transferable",
        amountTrackerId: "",
        challengeTrackerId: "",

      });
    } else {
      if (revokable) {
        newApprovals.push({
          fromMappingId: "AllWithoutMint",
          toMappingId: "AllWithoutMint",
          initiatedByMappingId: "Manager",
          badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          toMapping: getReservedAddressMapping("AllWithoutMint") as AddressMapping,
          fromMapping: getReservedAddressMapping("AllWithoutMint") as AddressMapping,
          initiatedByMapping: getReservedAddressMapping(chain.cosmosAddress) as AddressMapping,
          amountTrackerId: "revoke",
          approvalId: "revoke",
          challengeTrackerId: "",
          approvalCriteria: {
            overridesFromOutgoingApprovals: true,
            overridesToIncomingApprovals: false,
            requireFromDoesNotEqualInitiatedBy: false,
            requireFromEqualsInitiatedBy: false,
            requireToDoesNotEqualInitiatedBy: false,
            requireToEqualsInitiatedBy: false,
            mustOwnBadges: [],
            predeterminedBalances: {
              incrementedBalances: {
                startBalances: [],
                incrementBadgeIdsBy: 0n,
                incrementOwnershipTimesBy: 0n,
              },
              manualBalances: [],
              orderCalculationMethod: {
                useMerkleChallengeLeafIndex: false,
                useOverallNumTransfers: false,
                usePerFromAddressNumTransfers: false,
                usePerInitiatedByAddressNumTransfers: false,
                usePerToAddressNumTransfers: false,
              },
            },
            approvalAmounts: {
              overallApprovalAmount: 0n,
              perFromAddressApprovalAmount: 0n,
              perInitiatedByAddressApprovalAmount: 0n,
              perToAddressApprovalAmount: 0n,
            },
            maxNumTransfers: {
              overallMaxNumTransfers: 0n,
              perFromAddressMaxNumTransfers: 0n,
              perInitiatedByAddressMaxNumTransfers: 0n,
              perToAddressMaxNumTransfers: 0n,
            },
          },
          transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
        });
      }

      let toMappingId = "AllWithoutMint";
      let fromMappingId = "AllWithoutMint";
      let initiatedByMappingId = "AllWithoutMint";
      if (defaultTransferable) {
        for (const user of frozenUsers) {
          toMappingId += ":" + convertToCosmosAddress(user);
          fromMappingId += ":" + convertToCosmosAddress(user);
          initiatedByMappingId += ":" + convertToCosmosAddress(user);
        }

        newApprovals.push({
          fromMappingId: fromMappingId,
          toMappingId: toMappingId,
          initiatedByMappingId: initiatedByMappingId,
          badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          toMapping: getReservedAddressMapping(toMappingId) as AddressMapping,
          fromMapping: getReservedAddressMapping(fromMappingId) as AddressMapping,
          initiatedByMapping: getReservedAddressMapping(initiatedByMappingId) as AddressMapping,
          amountTrackerId: amountTrackerId.current,
          approvalId: amountTrackerId.current,
          challengeTrackerId: "",
          approvalCriteria: mustOwnBadges && mustOwnBadges.length > 0 ?
            {
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
              requireToEqualsInitiatedBy: false,
              requireFromEqualsInitiatedBy: false,
              requireToDoesNotEqualInitiatedBy: false,
              requireFromDoesNotEqualInitiatedBy: false,
              merkleChallenge: {
                root: '',
                maxOneUsePerLeaf: false,
                expectedProofLength: 0n,
                useCreatorAddressAsLeaf: false,

                uri: '',
                customData: '',
              },

              overridesToIncomingApprovals: false,
              overridesFromOutgoingApprovals: false,
            }

            : undefined,
          transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        });

      }
    }


    collections.updateCollection({
      ...collection,
      collectionApprovals: deepCopy(newApprovals),
    });
  }




  if (!collection) return EmptyStepItem;

  const err = startingCollection ? validateCollectionApprovalsUpdate(startingCollection.collectionApprovals, collection.collectionApprovals, startingCollection.collectionPermissions.canUpdateCollectionApprovals) : undefined;

  return {
    title: `Select Transferability`,
    // description: 
    description: <>{`Excluding transfers from the Mint address, should badges be transferable or non-transferable?`}
      <br /><br />
      {existingCollectionId ? <> {`Current Permission - Can Update Transferability?: `}
        {
          PermissionIcon(
            "canUpdateCollectionApprovals",
            castCollectionApprovalPermissionToUniversalPermission(startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []), ApprovalPermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovals}
      setUpdateFlag={setUpdateCollectionApprovals}
      jsonPropertyPath='collectionApprovals'
      permissionName='canUpdateCollectionApprovals'
      customRevertFunction={() => {
        const existingNonMint = startingCollection ? getNonMintApprovals(startingCollection, true) : [];

        collections.updateCollection({
          ...collection,
          collectionApprovals: [
            ...approvalsToAdd,
            ...existingNonMint
          ],
        });
      }}
      nonMintOnly
      node={
        <div className="primary-text">

          <ErrDisplay err={err} />

          <SwitchForm
            // noSelectUntilClick
            showCustomOption
            options={[
              {
                title: 'Completely Non-Transferable',
                message: `Badges will be completely non-transferable.`,
                isSelected: nonTransferable && !showAdditional
              },
              {
                title: 'Completely Transferable',
                message: `Badges will be completely transferable with no restrictions.`,
                isSelected: transferable && !showAdditional
              },
              {
                title: 'Custom',
                message: `Badges will be completely transferable with no restrictions.`,
                isSelected: showAdditional
              },
            ]}
            onSwitchChange={(idx) => {
              setClicked(true);
              handleClick(idx == 0, idx == 1);
              setShowAdditional(idx == 2);
            }}
          />
          <br />
          {
            clicked && showAdditional &&
            <>

              <br />

              <Row className='full-width primary-text' style={{ textAlign: 'center' }}>
                <Col md={24} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 10, paddingRight: 10, }}>
                  {<>
                    <SwitchForm
                      showCustomOption
                      options={[

                        {
                          title: 'Non-Tranferable',
                          message: `We will start with a base of everything being non-transferable, and you can add additional restrictions below.`,
                          isSelected: !defaultTransferable
                        },
                        {
                          title: 'Transferable',
                          message: `We will start with a base of everything being transferable, and you can add additional restrictions below.`,
                          isSelected: defaultTransferable
                        },
                      ]}
                      onSwitchChange={(idx) => {
                        setDefaultTransferable(idx == 1);
                      }}
                    />
                  </>}
                </Col>
                <Divider />
                <Col md={24} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 10, paddingRight: 10, }}>
                  {manager && <>
                    <SwitchForm
                      showCustomOption
                      options={[
                        {
                          title: 'Non-Revokable',
                          message: `Badges will be non-revokable.`,
                          isSelected: !revokable
                        },
                        {
                          title: 'Revokable',
                          message: `Badges will be revokable by the maanger.`,
                          isSelected: revokable
                        },
                      ]}
                      onSwitchChange={(idx) => {
                        setRevokable(idx == 1);
                      }}
                    />
                  </>}
                </Col>
                {defaultTransferable && <>
                  <Divider />
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
                </>}
              </Row>
            </>
          }

          {
            <>
              <br />
              <hr />
              <br />
              <div className='flex-center'>
                <Typography.Text className='primary-text' strong style={{ fontSize: 24, textAlign: 'center' }}>
                  Distribution
                </Typography.Text>
              </div>

              <div className='flex-center' style={{ textAlign: 'center' }}>
                <TransferabilityTab collectionId={0n} onlyShowNotFromMint />
              </div>
            </>
          }
        </div >
      }
    />,
    disabled: !!err,
  }
}