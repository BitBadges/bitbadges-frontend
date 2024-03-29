import {
  AddressList,
  UintRangeArray,
  UserBalanceStoreWithDetails,
  UserIncomingApprovalWithDetails,
  appendSelfInitiatedIncomingApproval
} from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { compareObjects } from '../../../utils/compare';
import { AddressDisplayList } from '../../address/AddressDisplayList';
import { EditableApprovalsDisplay } from '../../collection-page/transferability/ApprovalsDisplay';
import { SwitchForm } from '../form-items/SwitchForm';
import { UpdateSelectWrapper } from '../form-items/UpdateSelectWrapper';

export const defaultApprovedOption = [
  new UserIncomingApprovalWithDetails({
    fromListId: 'All',
    fromList: AddressList.AllAddresses(),
    initiatedByList: AddressList.AllAddresses(),
    initiatedByListId: 'All',
    transferTimes: UintRangeArray.FullRanges(),
    badgeIds: UintRangeArray.FullRanges(),
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId: 'default-incoming-allowed',
    amountTrackerId: 'default-incoming-allowed',
    challengeTrackerId: 'default-incoming-allowed'
  })
];

export const DefaultApprovedDisplay = ({ address }: { address: string }) => {
  return (
    <div className="flex flex-col overflow-x-auto">
      <table className="table-auto w-full overflow-x-scroll">
        <thead>
          <tr className="">
            <th className="p-2"></th>
            <th className="p-2">
              <b>To</b>
            </th>
            <th className="p-2">
              <b>Initiator</b>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            <td className="p-2">
              <CheckCircleFilled style={{ fontSize: 20, color: 'green' }} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[address]} allExcept={false} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[]} allExcept={true} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const DefaultOptInDisplay = ({ address }: { address: string }) => {
  return (
    <div className="flex flex-col overflow-x-auto">
      <table className="table-auto w-full overflow-x-scroll">
        <thead>
          <tr className="">
            <th className="p-2"></th>
            <th className="p-2">
              <b>To</b>
            </th>
            <th className="p-2">
              <b>Initiator</b>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            <td className="p-2">
              <CheckCircleFilled style={{ fontSize: 20, color: 'green' }} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[address]} allExcept={false} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[address]} allExcept={false} />
            </td>
          </tr>
          <tr className="text-center">
            <td className="p-2">
              <CloseCircleFilled style={{ fontSize: 20, color: 'red' }} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[address]} allExcept={false} />
            </td>
            <td className="p-2">
              <AddressDisplayList users={[address]} allExcept={true} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export function DefaultToApprovedSelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const chain = useChainContext();

  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  return {
    title: `Default Incoming Approvals`,
    description: `If not overriden by the collection approvals, all badge transfers need to satisfy the recipient's incoming approvals. What should the incoming approvals be by default?`,
    node: () => (
      <UpdateSelectWrapper
        documentationLink={'https://docs.bitbadges.io/overview/how-it-works/transferability'}
        err={null}
        setErr={() => {}}
        updateFlag={updateFlag}
        setUpdateFlag={setUpdateFlag}
        jsonPropertyPath="defaultUserIncomingApprovals"
        advancedNode={() => (
          <>
            <div style={{ textAlign: 'center' }}>
              <EditableApprovalsDisplay
                approvals={(collection.defaultBalances.incomingApprovals.length > 0
                  ? collection.defaultBalances.incomingApprovals
                  : appendSelfInitiatedIncomingApproval([], chain.address)
                ).map((x) => x.castToCollectionTransfer(chain.address))}
                collectionId={collection.collectionId}
                approvalLevel="incoming"
                editable={true}
                //genesis only so will always not have existing approvals or permissions
                startingApprovals={[]}
                approvalPermissions={[]}
                mintingOnly={false}
                setApprovals={(approvals) => {
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    defaultBalances: new UserBalanceStoreWithDetails({
                      ...collection.defaultBalances,
                      incomingApprovals: approvals
                    })
                  });
                }}
                approverAddress={chain.address}
              />
            </div>
          </>
        )}
        node={() => (
          <>
            <SwitchForm
              showCustomOption
              options={[
                {
                  title: 'Approved by Default',
                  message: `For all users, all incoming transfers (including mints) will be approved by default. To block incoming transfers, users must manually set their incoming approvals.`,
                  isSelected: compareObjects(collection.defaultBalances.incomingApprovals, defaultApprovedOption),
                  additionalNode: () => (
                    <>
                      <DefaultApprovedDisplay address={chain.address} />
                    </>
                  )
                },
                {
                  title: 'Opt-In Only',
                  message:
                    'By default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints). This is typically only used in specific cases, such as a KYC requirement.',
                  isSelected: collection.defaultBalances.incomingApprovals.length === 0,
                  additionalNode: () => (
                    <>
                      <DefaultOptInDisplay address={chain.address} />
                    </>
                  )
                }
              ]}
              onSwitchChange={(idx) => {
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  defaultBalances: new UserBalanceStoreWithDetails({
                    ...collection.defaultBalances,
                    incomingApprovals: idx === 0 ? defaultApprovedOption : []
                  })
                });
              }}
            />
          </>
        )}
      />
    )
  };
}
