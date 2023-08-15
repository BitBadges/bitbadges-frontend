import { CheckCircleOutlined, DownOutlined, FieldTimeOutlined, InfoCircleOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons';
import { Divider, Popover, Select, Tooltip, Typography } from 'antd';
import { ApprovalTrackerIdDetails } from 'bitbadgesjs-proto';
import { CollectionApprovedTransferWithDetails, getCurrentValueIdxForTimeline, getFirstMatchForCollectionApprovedTransfers, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { DEV_MODE, INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';

export const getTableHeader = () => {
  return <tr>
    <td style={{ minWidth: 70 }}><b>
      From
    </b></td>
    <td style={{ minWidth: 70 }}><b>
      To
    </b></td>
    <td style={{ minWidth: 70 }}><b>
      Initiated By <Tooltip title="The address that initiates the transfer transaction.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ minWidth: 70 }}><b>
      Transfer Times
      <Tooltip title="The times at which the transfer can take place.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ minWidth: 70 }}><b>
      Badge IDs
    </b></td>
    <td style={{ minWidth: 70 }}><b>
      Ownership Times
      <Tooltip title="The ownership times for the badges that are allowed to be transferred.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td><b>
      Approved?
    </b></td>
    <td><b>
      Other?
    </b></td>
  </tr>

}


export function TransferabilityRow({ transfer, badgeId, collectionId }: {
  transfer: CollectionApprovedTransferWithDetails<bigint>,
  badgeId?: bigint,
  setTab?: (tab: string) => void,
  collectionId: bigint,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];
  const chain = useChainContext();

  const x = transfer;

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = x.toMapping.addresses.filter(x => x !== 'Mint');
  const initiatedByAddresses = x.initiatedByMapping.addresses.filter(x => x !== 'Mint');

  //Only show rows that have at least one address (after filtration)
  if (
    (toAddresses.length == 0 && x.toMapping.includeAddresses) ||
    (initiatedByAddresses.length == 0 && x.initiatedByMapping.includeAddresses)
  ) return null;

  if (badgeId) {
    const [, found] = searchUintRangesForId(badgeId, x.badgeIds);
    if (!found) return null;

    x.badgeIds = [{ start: badgeId, end: badgeId }];
  }

  return <>
    <tr style={{ borderBottom: '1px solid gray' }} >
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={x.fromMapping.addresses}
          allExcept={!x.fromMapping.includeAddresses}
          fontSize={16}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={toAddresses}
          allExcept={!x.toMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={initiatedByAddresses}
          allExcept={!x.initiatedByMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>

      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(x.transferTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getBadgeIdsString(x.badgeIds)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(x.ownershipTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {x.allowedCombinations[0].isApproved ? <CheckCircleOutlined style={{ color: 'green', fontSize: 20 }} /> : <StopOutlined style={{ color: 'red', fontSize: 20 }} />}
      </td>

      <td style={{ alignItems: 'center' }}>
        {x.approvalDetails && x.approvalDetails.length > 0 && x.allowedCombinations[0].isApproved ? '' : 'No'}

        {x.approvalDetails && x.approvalDetails.length > 0 &&
          <>
            <ul style={{ textAlign: 'left' }}>
              {x.approvalDetails[0].requireFromDoesNotEqualInitiatedBy && (
                <li>From != Initiated By</li>
              )}
              {x.approvalDetails[0].requireFromEqualsInitiatedBy && (
                <li>From == Initiated By</li>
              )}
              {x.approvalDetails[0].requireToDoesNotEqualInitiatedBy && (
                <li>To != Initiated By</li>
              )}
              {x.approvalDetails[0].requireToEqualsInitiatedBy && (
                <li>To == Initiated By</li>
              )}
              {x.fromMappingId !== "Mint" && x.approvalDetails[0].overridesFromApprovedOutgoingTransfers ? (
                <li>Overrides From Approvals</li>
              ) : (
                x.fromMappingId !== "Mint" && <li>Must Satisfy Outgoing Approvals of From Address</li>
              )}
              {x.fromMappingId === "Mint" && !x.approvalDetails[0].overridesFromApprovedOutgoingTransfers && (
                <>
                  <li>
                    <WarningOutlined style={{ color: 'orange' }} /> Must Satisfy Outgoing Approvals for Mint Address (Mint never has approvals so this row will never work)
                  </li>
                </>
              )}
              {x.approvalDetails[0].overridesToApprovedIncomingTransfers ? (
                <li>Overrides To Approvals</li>
              ) : (
                <li>Must Satisfy Incoming Approvals of To Address</li>
              )}
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-between primary-blue-bg primary-text'>
                <div>
                  {x.approvalDetails && x.approvalDetails.length > 0 && x.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                    <BalanceDisplay
                      message='Start Balances'
                      balances={x.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances}
                      collectionId={collectionId}
                    />
                    <br />
                    <b>Badge Increment: </b> {x.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString()}
                    <br />
                    <b>Times Increment: </b>{x.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString()}
                    <br />
                    <p style={{ inlineSize: 'max-content', wordBreak: "break-all", wordWrap: "break-word", overflowWrap: "break-word" }}> <b># Increments Calculation Method: </b>{Object.entries(x.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "useOverallNumTransfers" ?
                      <>{"Overall Number of Transfers - First processed transfer will be for the starting balances without any increments applied. Second transfer will be the starting balances plus one increment. And so on."}</> : Object.entries(x.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0]}</p>
                  </>
                  )}

                  {x.approvalDetails && x.approvalDetails.length > 0 && x.approvalDetails[0].predeterminedBalances.manualBalances.length > 0 && (<>

                    {x.approvalDetails[0].predeterminedBalances.manualBalances.map((balances, idx) => {

                      return <BalanceDisplay
                        key={idx}
                        message='Predetermined Balances'
                        balances={balances.balances}
                        collectionId={collectionId}
                      />
                    })}
                    <br />
                    <b>Increment Calculation Method: </b>{Object.entries(x.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0]}
                  </>
                  )}


                </div>
              </div>
              }>
                {x.approvalDetails[0].predeterminedBalances && (x.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
                  x.approvalDetails[0].predeterminedBalances && x.approvalDetails[0].predeterminedBalances.manualBalances.length > 0) &&
                  (
                    <li>Predetermined Balances for Each Transfer</li>
                  )}
                {x.approvalDetails[0].merkleChallenges && x.approvalDetails[0].merkleChallenges.length > 0 && (
                  <>
                    {x.approvalDetails[0].merkleChallenges.find(x => x.useCreatorAddressAsLeaf) ? (
                      <li>Whitelist Only</li>
                    ) :
                      <li>Must Provide Valid Code / Password</li>
                    }
                  </>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={
                x.approvalDetails[0].mustOwnBadges?.length > 0 &&
                <div className='flex-center flex-column primary-text'>
                  <BalanceDisplay
                    message='Min Amounts'
                    balances={x.approvalDetails[0].mustOwnBadges.map(x => {
                      return {
                        ...x,
                        amount: x.amountRange.start,
                      }
                    })}
                    collectionId={collectionId}
                  />
                  <br />
                  <br />
                  <BalanceDisplay
                    message='Max Amounts'
                    balances={x.approvalDetails[0].mustOwnBadges.map(x => {
                      return {
                        ...x,
                        amount: x.amountRange.start,
                      }
                    })}
                    collectionId={collectionId}
                  />
                </div>
              }>
                {x.approvalDetails[0].mustOwnBadges?.length > 0 && (
                  <li>Must Own Specific Badges to Transfer</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                {x.approvalDetails[0].approvalAmounts.overallApprovalAmount > 0
                  && (
                    <>
                      <div>Showing results for:</div>

                      <AddressDisplay addressOrUsername={chain.address} />
                      <br />
                      <BalanceDisplay
                        message='Approved Amounts'
                        balances={
                          [
                            {
                              amount: x.approvalDetails[0].approvalAmounts.overallApprovalAmount,
                              badgeIds: x.badgeIds,
                              ownershipTimes: x.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "overall")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {x.approvalDetails[0].approvalAmounts.overallApprovalAmount > 0 && (
                  <li>Overall Approval Amount (All Users)</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                {x.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount > 0
                  && (
                    <>
                      <div>Showing results for:</div>

                      <AddressDisplay addressOrUsername={chain.address} />
                      <br />
                      <BalanceDisplay
                        message='Approved Amounts'
                        balances={
                          [
                            {
                              amount: x.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount,
                              badgeIds: x.badgeIds,
                              ownershipTimes: x.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "to")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {x.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount > 0 && (
                  <li>Per To Address Approval Amounts</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                {x.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount > 0
                  && (
                    <>
                      <div>Showing results for:</div>

                      <AddressDisplay addressOrUsername={chain.address} />
                      <br />
                      <BalanceDisplay
                        message='Approved Amounts'
                        balances={
                          [
                            {
                              amount: x.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount,
                              badgeIds: x.badgeIds,
                              ownershipTimes: x.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "from")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {x.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount > 0 && (
                  <li>Per From Address Approval Amounts</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                {x.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount > 0
                  && (
                    <>
                      <div>Showing results for:</div>

                      <AddressDisplay addressOrUsername={chain.address} />
                      <br />
                      <BalanceDisplay
                        message='Approved Amounts'
                        balances={
                          [
                            {
                              amount: x.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount,
                              badgeIds: x.badgeIds,
                              ownershipTimes: x.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "initiatedBy")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {x.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount > 0 && (
                  <li>Per Initiated By Address Approval Amounts</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                {x.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (Overall): {collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "overall")?.numTransfers.toString() ?? 0}
                    out of {x.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {x.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0 && (
                  <li>Overall Max Transfers (All Users): {x.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {x.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (To): {collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "to")?.numTransfers.toString() ?? 0}
                    {' '}out of {x.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {x.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per To Address: {x.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {x.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (From): {collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "from")?.numTransfers.toString() ?? 0}
                    {' '}out of {x.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {x.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per From Address: {x.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {x.approvalDetails[0].approvalId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {x.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (Initiated By): {collection?.approvalsTrackers.find(y => y.approvalId === x.approvalDetails[0].approvalId && y.trackerType === "initiatedBy")?.numTransfers.toString() ?? 0}
                    {' '}out of {x.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {x.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per Initiated By Address: {x.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>

            </ul>

          </>

        }
      </td >
      {/* <td>
        {x.fromMappingId === "Mint" && <Button className='screen-button' onClick={() => { if (setTab) setTab('claims'); }}>
          Go To Claim
        </Button>}
      </td> */}

    </tr >
  </>
}


export function TransferabilityTab({ collectionId, badgeId, setTab }: {
  collectionId: bigint,
  badgeId?: bigint,
  setTab?: (tab: string) => void,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];
  const currTransferabilityIdx = getCurrentValueIdxForTimeline(collection?.collectionApprovedTransfersTimeline ?? []);
  const [defaultIdx, setDefaultIdx] = useState<number>(Number(currTransferabilityIdx));
  const chain = useChainContext();


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers b');
    if (collectionId > 0) {
      async function fetchTrackers() {
        const idx = getCurrentValueIdxForTimeline(collection?.collectionApprovedTransfersTimeline ?? []);
        const defaultIdx = idx < 0 ? 0 : idx;

        if (collection && collection?.collectionApprovedTransfersTimeline.length > 0) {

          const approvedTransfers = collection?.collectionApprovedTransfersTimeline[Number(defaultIdx)].collectionApprovedTransfers.filter(x => x.approvalDetails.length > 0);


          const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] =
            approvedTransfers.map(approvedTransfer => {
              return [{
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: "",
                approverAddress: "",
                trackerType: "overall",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "initiatedBy",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "to",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "from",
              },
              ] as ApprovalTrackerIdDetails<bigint>[];
            }).flat();
          collections.fetchCollectionsWithOptions([{
            collectionId,
            viewsToFetch: [],
            merkleChallengeIdsToFetch: [],
            approvalsTrackerIdsToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
          }]);
        }

      }
      fetchTrackers();

    }
  }, []);

  if (!collection) return <></>;

  const firstMatches = getFirstMatchForCollectionApprovedTransfers(defaultIdx < 0 ? [] : collection.collectionApprovedTransfersTimeline[Number(defaultIdx)].collectionApprovedTransfers, true);


  return (
    <div className='primary-text'>
      <br />
      <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>

        {collection && ((collection?.collectionApprovedTransfersTimeline.length > 1)) ?
          <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
            Transferability <FieldTimeOutlined style={{ marginLeft: 4 }} />
          </Tooltip> : <> </>
        }


      </Typography.Text>

      <div className='flex-between' style={{ overflow: 'auto' }}>

        <table style={{ width: '100%', fontSize: 16 }}>
          {getTableHeader()}
          <br />
          {
            firstMatches.map((x, idx) => {
              return <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} setTab={setTab} collectionId={collectionId} />
            }
            )
          }

        </table>
      </div>

      <Divider />
      {collection && ((collection?.collectionApprovedTransfersTimeline.length > 1)) ?
        <>
          <Select
            className="selector primary-text primary-blue-bg"
            style={{ marginLeft: 4 }}
            defaultValue={defaultIdx}
            onChange={(value) => {
              setDefaultIdx(Number(value));
            }}
            suffixIcon={
              <DownOutlined
                className='primary-text'
              />
            }
          >
            {collection?.collectionApprovedTransfersTimeline.map((timeline, idx) => {
              return <Select.Option key={idx} value={idx}>{getTimeRangesElement(timeline.timelineTimes, '', true)}</Select.Option>
            })}
          </Select>
          <br />
          <br />
        </> : <> </>
      }

      <p>
        <InfoCircleOutlined />{' '}Transferability is broken down into multiple criteria: who can send? who can receive? etc.
        Each row below represents a different set of criteria. For a transfer to be allowed, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
      </p>

      <Divider />
      <p>Note: Go to permissions on the overview tab to see if these currently set values can be changed or not by the manager.</p>
      <br />
    </div >
  );
}
