import { CheckCircleFilled, InfoCircleOutlined, StopFilled, WarningOutlined } from '@ant-design/icons';
import { Popover, Tooltip } from 'antd';
import { CollectionApprovedTransferWithDetails, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { DEV_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';

export const getTableHeader = () => {
  return <tr >
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      From
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      To
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Initiated By <Tooltip title="The address that initiates the transfer transaction.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Transfer Times
      <Tooltip title="The times at which the transfer can take place.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Badge IDs
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Ownership Times
      <Tooltip title="The ownership times for the badges that are allowed to be transferred.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Approved?
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 250 }}><b>
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

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = transfer.toMapping.addresses.filter(x => x !== 'Mint');
  const initiatedByAddresses = transfer.initiatedByMapping.addresses.filter(x => x !== 'Mint');

  //Only show rows that have at least one address (after filtration)
  if ((toAddresses.length == 0 && transfer.toMapping.includeAddresses) ||
    (initiatedByAddresses.length == 0 && transfer.initiatedByMapping.includeAddresses)
  ) return null;

  if (badgeId) {
    const [, found] = searchUintRangesForId(badgeId, transfer.badgeIds);
    if (!found) return null;

    transfer.badgeIds = [{ start: badgeId, end: badgeId }];
  }

  //TODO: Refactor this 
  return <>
    <tr style={{ borderBottom: '1px solid gray' }} >
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={transfer.fromMapping.addresses}
          allExcept={!transfer.fromMapping.includeAddresses}
          fontSize={16}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={toAddresses}
          allExcept={!transfer.toMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={initiatedByAddresses}
          allExcept={!transfer.initiatedByMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>

      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(transfer.transferTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getBadgeIdsString(transfer.badgeIds)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(transfer.ownershipTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {transfer.allowedCombinations[0].isApproved ? <CheckCircleFilled style={{ color: 'green', fontSize: 20 }} /> : <StopFilled style={{ color: 'red', fontSize: 20 }} />}
      </td>

      <td style={{ alignItems: 'center' }}>
        {transfer.approvalDetails && transfer.approvalDetails.length > 0 && transfer.allowedCombinations[0].isApproved ? '' : 'No'}

        {transfer.approvalDetails && transfer.approvalDetails.length > 0 &&
          <>
            <ul style={{ textAlign: 'left' }}>
              {transfer.approvalDetails[0].requireFromDoesNotEqualInitiatedBy && (
                <li>From Must NOT Equal Initiated By</li>
              )}
              {transfer.approvalDetails[0].requireFromEqualsInitiatedBy && (
                <li>From Must Equal Initiated By</li>
              )}
              {transfer.approvalDetails[0].requireToDoesNotEqualInitiatedBy && (
                <li>To Must NOT Equal Initiated By</li>
              )}
              {transfer.approvalDetails[0].requireToEqualsInitiatedBy && (
                <li>To Must Equal Initiated By</li>
              )}
              {transfer.fromMappingId !== "Mint" && transfer.approvalDetails[0].overridesFromApprovedOutgoingTransfers ? (
                <li>Overrides From Approvals</li>
              ) : (
                transfer.fromMappingId !== "Mint" && <li>Must Satisfy Outgoing Approvals</li>
              )}
              {transfer.fromMappingId === "Mint" && !transfer.approvalDetails[0].overridesFromApprovedOutgoingTransfers && (
                <>
                  <li>
                    <WarningOutlined style={{ color: 'orange' }} /> Must Satisfy Outgoing Approvals for Mint Address (Mint never has approvals so this row will never work)
                  </li>
                </>
              )}
              {transfer.approvalDetails[0].overridesToApprovedIncomingTransfers ? (
                <li>Overrides To Approvals</li>
              ) : (
                <li>Must Satisfy Incoming Approvals</li>
              )}
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-between primary-blue-bg primary-text'>
                <div>
                  {transfer.approvalDetails && transfer.approvalDetails.length > 0 && transfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                    <BalanceDisplay
                      message='Start Balances'
                      balances={transfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances}
                      collectionId={collectionId}
                    />
                    <br />
                    <b>Badge Increment: </b> {transfer.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString()}
                    <br />
                    <b>Times Increment: </b>{transfer.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString()}
                    <br />
                    <p style={{ inlineSize: 'max-content', wordBreak: "break-all", wordWrap: "break-word", overflowWrap: "break-word" }}> <b># Increments Calculation Method: </b>{Object.entries(transfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "useOverallNumTransfers" ?
                      <>{"Overall Number of Transfers - First processed transfer will be for the starting balances without any increments applied. Second transfer will be the starting balances plus one increment. And so on."}</>
                      : Object.entries(transfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "useMerkleChallengeLeafIndex" ?
                        <>{`Predetermined - The creator of this claim prereserved specific increments for specific ${transfer.approvalDetails[0].merkleChallenges[0].useCreatorAddressAsLeaf ? 'addresses' : 'codes'}.`}</>
                        : Object.entries(transfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0]}</p>
                  </>
                  )}

                  {transfer.approvalDetails && transfer.approvalDetails.length > 0 && transfer.approvalDetails[0].predeterminedBalances.manualBalances.length > 0 && (<>

                    {transfer.approvalDetails[0].predeterminedBalances.manualBalances.map((balances, idx) => {

                      return <BalanceDisplay
                        key={idx}
                        message='Predetermined Balances'
                        balances={balances.balances}
                        collectionId={collectionId}
                      />
                    })}
                    <br />
                    <b>Increment Calculation Method: </b>{Object.entries(transfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0]}
                  </>
                  )}


                </div>
              </div>
              }>
                {transfer.approvalDetails[0].predeterminedBalances && (transfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
                  transfer.approvalDetails[0].predeterminedBalances && transfer.approvalDetails[0].predeterminedBalances.manualBalances.length > 0) &&
                  (
                    <li>Predetermined Balances for Each Transfer</li>
                  )}
                {transfer.approvalDetails[0].merkleChallenges && transfer.approvalDetails[0].merkleChallenges.length > 0 && (
                  <>
                    {transfer.approvalDetails[0].merkleChallenges.find(x => x.useCreatorAddressAsLeaf) ? (
                      <li>Whitelist Only</li>
                    ) :
                      <li>Must Provide Valid Code / Password</li>
                    }
                  </>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={
                transfer.approvalDetails[0].mustOwnBadges?.length > 0 &&
                <div className='flex-center flex-column primary-text'>
                  <BalanceDisplay
                    message='Min Amounts'
                    balances={transfer.approvalDetails[0].mustOwnBadges.map(x => {
                      return {
                        ...x,
                        amount: x.amountRange.start,
                      }
                    })}
                    collectionId={transfer.approvalDetails[0].mustOwnBadges[0].collectionId}
                    isMustOwnBadgesInput={transfer.approvalDetails[0].mustOwnBadges[0].overrideWithCurrentTime}
                  />
                  <br />
                  <br />
                  <BalanceDisplay
                    message='Max Amounts'
                    balances={transfer.approvalDetails[0].mustOwnBadges.map(x => {
                      return {
                        ...x,
                        amount: x.amountRange.start,
                      }
                    })}
                    collectionId={transfer.approvalDetails[0].mustOwnBadges[0].collectionId}
                    isMustOwnBadgesInput={transfer.approvalDetails[0].mustOwnBadges[0].overrideWithCurrentTime}
                  />
                </div>
              }>
                {transfer.approvalDetails[0].mustOwnBadges?.length > 0 && (
                  <li>Must Own Specific Badges to Transfer</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                {transfer.approvalDetails[0].approvalAmounts.overallApprovalAmount > 0
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
                              amount: transfer.approvalDetails[0].approvalAmounts.overallApprovalAmount,
                              badgeIds: transfer.badgeIds,
                              ownershipTimes: transfer.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "overall")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {transfer.approvalDetails[0].approvalAmounts.overallApprovalAmount > 0 && (
                  <li>Overall Approval Amount (All Users)</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                {transfer.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount > 0
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
                              amount: transfer.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount,
                              badgeIds: transfer.badgeIds,
                              ownershipTimes: transfer.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "to")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {transfer.approvalDetails[0].approvalAmounts.perToAddressApprovalAmount > 0 && (
                  <li>Per To Address Approval Amounts</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                {transfer.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount > 0
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
                              amount: transfer.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount,
                              badgeIds: transfer.badgeIds,
                              ownershipTimes: transfer.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "from")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {transfer.approvalDetails[0].approvalAmounts.perFromAddressApprovalAmount > 0 && (
                  <li>Per From Address Approval Amounts</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                {transfer.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount > 0
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
                              amount: transfer.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount,
                              badgeIds: transfer.badgeIds,
                              ownershipTimes: transfer.ownershipTimes
                            }
                          ]
                        }
                        collectionId={collectionId}
                      />
                      <br />
                      <br />
                      <BalanceDisplay
                        message='Already Transferred'
                        balances={collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "initiatedBy")?.amounts ?? []}
                        collectionId={collectionId}
                      />
                    </>
                  )}
              </div>
              }>
                {transfer.approvalDetails[0].approvalAmounts.perInitiatedByAddressApprovalAmount > 0 && (
                  <li>Per Initiated By Address Approval Amounts</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                {transfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (Overall): {collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "overall")?.numTransfers.toString() ?? 0}
                    {' '}out of {transfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {transfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0 && (
                  <li>Overall Max Transfers (All Users): {transfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {transfer.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (To): {collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "to")?.numTransfers.toString() ?? 0}
                    {' '}out of {transfer.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {transfer.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per To Address: {transfer.approvalDetails[0].maxNumTransfers.perToAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {transfer.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (From): {collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "from")?.numTransfers.toString() ?? 0}
                    {' '}out of {transfer.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {transfer.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per From Address: {transfer.approvalDetails[0].maxNumTransfers.perFromAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>
              <Popover placement='bottom' overlayInnerStyle={{ background: '#001529', border: '1px solid gray' }} className='primary-blue-bg' content={<div className='flex-center flex-column primary-text'>
                {DEV_MODE && <li>Approvals Tracker ID: {transfer.approvalDetails[0].approvalTrackerId}</li>}
                <div>Showing results for:</div>

                <AddressDisplay addressOrUsername={chain.address} />
                <br />
                {transfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0 && (
                  <li>Current Num Transfers (Initiated By): {collection?.approvalsTrackers.find(y => y.approvalTrackerId === transfer.approvalDetails[0].approvalTrackerId && y.trackerType === "initiatedBy")?.numTransfers.toString() ?? 0}
                    {' '}out of {transfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString()}</li>)}

              </div>
              }>
                {transfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0 && (
                  <li>Max Transfers per Initiated By Address: {transfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers.toString()}</li>
                )}
              </Popover>

            </ul>

          </>

        }
      </td >

    </tr >
  </>
}
