import { FormOutlined } from '@ant-design/icons';
import { Tooltip, notification } from 'antd';
import { AddressList, UintRangeArray, convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { useMemo } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { RequiredApprovalProps } from '../ApprovalSelect';
import crypto from 'crypto';

export const ApprovalTemplates = ({
  collectionId,
  defaultApprovalToAdd,
  setApprovalToAdd
}: {
  collectionId: bigint;
  defaultApprovalToAdd: RequiredApprovalProps;
  setApprovalToAdd: (approval: RequiredApprovalProps) => void;
}) => {
  const collection = useCollection(collectionId);
  const chain = useChainContext();

  const getCurrentManagerApprovals = () => {
    const approvals: RequiredApprovalProps[] = [];

    if (!collection) return approvals;

    for (const managerTimelineVal of collection.managerTimeline) {
      const times = managerTimelineVal.timelineTimes;
      const manager = managerTimelineVal.manager;

      if (!manager) continue;
      const id = crypto.randomBytes(32).toString('hex');

      approvals.push({
        ...defaultApprovalToAdd,
        toList: AddressList.AllAddresses(),
        toListId: 'All',
        fromListId: 'Mint',
        fromList: AddressList.getReservedAddressList('Mint'),
        initiatedByList: AddressList.getReservedAddressList(convertToCosmosAddress(manager)),
        initiatedByListId: convertToCosmosAddress(manager),
        transferTimes: times,
        badgeIds: UintRangeArray.FullRanges(),
        ownershipTimes: UintRangeArray.FullRanges(),
        approvalId: id,
        amountTrackerId: id,
        challengeTrackerId: id,
        approvalCriteria: {
          ...defaultApprovalToAdd.approvalCriteria,
          overridesFromOutgoingApprovals: true,
          overridesToIncomingApprovals: true
        }
      });
    }

    return approvals;
  };

  const currDate = useMemo(() => {
    const date = new Date();
    return date;
  }, []);

  const currDatePlus24Hours = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date;
  }, []);

  const approveSelfFor24Hours = () => {
    const id = crypto.randomBytes(32).toString('hex');

    return {
      ...defaultApprovalToAdd,
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      fromListId: 'Mint',
      fromList: AddressList.getReservedAddressList('Mint'),
      initiatedByList: AddressList.getReservedAddressList(chain.cosmosAddress),
      initiatedByListId: chain.cosmosAddress,
      transferTimes: [{ start: BigInt(currDate.getTime()), end: BigInt(currDatePlus24Hours.getTime()) }],
      badgeIds: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      amountTrackerId: id,
      challengeTrackerId: id,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    };
  };

  return (
    <div style={{ textAlign: 'center' }} className="">
      <b>Apply a template?</b>{' '}
      <div className="flex-center secondary-text flex-wrap">
        <Tooltip color="black" title="Approve yourself for 24 hours to transfer with no restrictions from the Mint address.">
          <button
            className="cursor-pointer hoverable styled-button-normal rounded p-2 m-2 "
            style={{ borderWidth: 1 }}
            onClick={() => {
              if (!collection) return;

              setApprovalToAdd(approveSelfFor24Hours());

              notification.success({
                message: 'Template applied'
              });
            }}>
            <FormOutlined /> Approve self for 24 hours
          </button>
        </Tooltip>
        {getCurrentManagerApprovals().length == 1 && (
          <Tooltip
            color="black"
            title="Using the selected values for the manager, this will create an approval that approves the manager at any given time to transfer from the Mint address with no restrictions.">
            <button
              className="cursor-pointer hoverable styled-button-normal rounded p-2 m-2"
              style={{ borderWidth: 1 }}
              onClick={() => {
                if (!collection) return;

                setApprovalToAdd(getCurrentManagerApprovals()[0]);

                notification.success({
                  message: 'Template applied'
                });
              }}>
              <FormOutlined /> Approve current manager at any given time
            </button>
          </Tooltip>
        )}
      </div>
      <br />
    </div>
  );
};
