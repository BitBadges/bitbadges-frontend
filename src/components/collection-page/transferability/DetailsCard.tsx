import { ApiFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Statistic, Tooltip } from 'antd';
import { BalanceArray, ClaimIntegrationPluginType, CollectionApprovalWithDetails } from 'bitbadgesjs-sdk';
import { useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAmountRestrictions, approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../../bitbadges-api/utils/claims';
import { getPlugin } from '../../../integrations/integrations';
import { AddressDisplayList } from '../../address/AddressDisplayList';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { MustOwnBadgesCard } from './MustOwnBadgesCard';
import { ReactNode } from 'react';

export const PluginTextDisplay = <T extends ClaimIntegrationPluginType>({ pluginId, text }: { pluginId: T; text: string | ReactNode }) => {
  const pluginInstance = getPlugin(pluginId);
  if (!pluginInstance.detailsString) return null;

  return (
    <>
      <Tooltip
        style={{ minWidth: 300 }}
        title={
          <div className="text-center">
            <b>{pluginInstance.metadata.name}</b>
            <br />
            <br />
            {pluginInstance.metadata.description}
            <br />
            <br />
            <div className="secondary-text">
              <InfoCircleOutlined /> This is checked off-chain through a centralized service ({pluginInstance.metadata.createdBy}).
            </div>
          </div>
        }
        color="black">
        <ApiFilled className="mr-2" />
      </Tooltip>
      <Avatar
        shape="square"
        src={typeof pluginInstance.metadata.image === 'string' ? (pluginInstance.metadata.image as string) : pluginInstance.metadata.image}
        style={{ marginRight: 8 }}
        size={24}
      />

      {text}
    </>
  );
};

export const DetailsCard = ({
  allApprovals,
  approval,
  isOutgoingDisplay,
  isIncomingDisplay,
  collectionId,
  address,
  isEdit
}: {
  allApprovals: Array<CollectionApprovalWithDetails<bigint>>;
  approval: CollectionApprovalWithDetails<bigint>;
  isOutgoingDisplay?: boolean;
  isIncomingDisplay?: boolean;
  collectionId: bigint;
  address?: string;
  isEdit?: boolean;
}) => {
  const hasApprovalAmounts = approvalHasApprovalAmounts(approval.approvalCriteria?.approvalAmounts);

  const hasMaxNumTransfers = approvalHasMaxNumTransfers(approval.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allApprovals.find(
    (x) =>
      x.amountTrackerId === approval.amountTrackerId &&
      x.approvalId !== approval.approvalId &&
      (isEdit ||
        ((hasApprovalAmounts || hasMaxNumTransfers) &&
          (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))))
  );

  const hasSameChallengeTrackerId = allApprovals.find(
    (x) =>
      x.challengeTrackerId === approval.challengeTrackerId &&
      x.approvalId !== approval.approvalId &&
      (isEdit ||
        (x.approvalCriteria?.merkleChallenge?.root &&
          approval.approvalCriteria?.merkleChallenge?.root &&
          x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf &&
          approval.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf))
  );

  const plugins = approval.details?.offChainClaims && approval.details.offChainClaims.length > 0 ? approval.details.offChainClaims[0].plugins : [];

  return (
    <InformationDisplayCard title="" inheritBg noBorder md={24} xs={24} sm={24}>
      <ul className="list-disc px-8 " style={{ textAlign: 'left' }}>
        {approval.approvalCriteria?.requireFromDoesNotEqualInitiatedBy && !isOutgoingDisplay && <li>{"Sender must NOT equal approver's address"}</li>}
        {approval.approvalCriteria?.requireFromEqualsInitiatedBy && !isOutgoingDisplay && <li>{"Sender must equal approver's address"}</li>}
        {approval.approvalCriteria?.requireToDoesNotEqualInitiatedBy && !isIncomingDisplay && (
          <li>{"Recipient must NOT equal approver's address"}</li>
        )}
        {approval.approvalCriteria?.requireToEqualsInitiatedBy && !isIncomingDisplay && <li>{"Recipient must equal approver's address"}</li>}
        {!isOutgoingDisplay && (
          <>
            {approval.fromListId !== 'Mint' && approval.approvalCriteria?.overridesFromOutgoingApprovals ? (
              <li>
                <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />
                {"Does not check the sender's outgoing approvals"}
              </li>
            ) : (
              approval.fromListId !== 'Mint' && <li>{"Must satisfy the sender's outgoing approvals"}</li>
            )}
          </>
        )}
        {approval.fromListId === 'Mint' && !approval.approvalCriteria?.overridesFromOutgoingApprovals && (
          <>
            <li>{'Must satisfy outgoing approvals for Mint address (Not possible so this will never work)'}</li>
          </>
        )}
        {!isIncomingDisplay && (
          <>
            {approval.approvalCriteria?.overridesToIncomingApprovals ? (
              <li>
                <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />
                {"Does not check the recipient's incoming approvals"}
              </li>
            ) : (
              <li>{"Must satisfy recipient's incoming approvals"}</li>
            )}
          </>
        )}
        {approval.approvalCriteria?.mustOwnBadges && approval.approvalCriteria?.mustOwnBadges?.length > 0 && (
          <>
            <li>{'Must own specific badges to be approved'}</li>
            <br />
            <MustOwnBadgesCard approval={approval} />
          </>
        )}
        {approval.approvalCriteria?.predeterminedBalances &&
          (approval.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
            (approval.approvalCriteria?.predeterminedBalances && approval.approvalCriteria?.predeterminedBalances.manualBalances.length > 0)) && (
            <li>{'Predetermined balances for each transfer (see balances section)'}</li>
          )}
        {approval.approvalCriteria?.merkleChallenge?.root && (
          <>
            {approval.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? (
              <>
                <li>{'Must be on whitelist'}</li>
                {approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf > 0n ? (
                  <li>{`Max ${approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per address`}</li>
                ) : (
                  <></>
                )}
                {(approval.details?.challengeDetails?.leavesDetails.leaves.length ?? 0n) > 0n && (
                  <div className="flex-center flex-column">
                    <br />
                    {
                      <>
                        <AddressDisplayList users={approval.details?.challengeDetails?.leavesDetails.leaves ?? []} allExcept={false} />
                        <br />
                      </>
                    }
                  </div>
                )}
              </>
            ) : (
              <>
                {(approval.details?.offChainClaims?.length == 0) && ( //handled below via plugins if using in-site claim builder
                  <li>
                    {`Must provide valid ${
                      approval.details ? (approval.details?.challengeDetails?.hasPassword ? 'password' : 'code') : 'password / code'
                    }`}
                    {(approval.details?.challengeDetails?.leavesDetails.leaves.length ?? 0) > 0 && (
                      <>
                        {' '}
                        ({approval.details?.challengeDetails?.leavesDetails.leaves.length.toString()}{' '}
                        {`${approval.details?.challengeDetails?.hasPassword ? 'password use' : 'valid code'}${
                          (approval.details?.challengeDetails?.leavesDetails.leaves.length ?? 0) > 1 ? 's' : ''
                        } total`}
                        )
                      </>
                    )}
                  </li>
                )}
              </>
            )}
          </>
        )}

        {plugins.map((x) => {
            const pluginInstance = getPlugin(x.id);
            if (!pluginInstance.detailsString) return null;

            return (
              <li key={x.id}>
                <div className="flex">
                  <PluginTextDisplay
                    pluginId={x.id}
                    text={pluginInstance.detailsString({
                      publicState: x.publicState,
                      metadata: pluginInstance.metadata,
                      publicParams: x.publicParams,
                      id: x.id
                    })}
                  />
                </div>
              </li>
            );
          })}

        <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="overall" componentType="list" />
        <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="to" componentType="list" />
        <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="from" componentType="list" />
        <MaxNumTransfersComponent
          hideDisplay
          approval={approval}
          collectionId={collectionId}
          address={address}
          type="initiatedBy"
          componentType="list"
        />
        <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="overall" componentType="list" />
        <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="to" componentType="list" />
        <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="from" componentType="list" />
        <ApprovalAmountsComponent
          hideDisplay
          approval={approval}
          collectionId={collectionId}
          address={address}
          type="initiatedBy"
          componentType="list"
        />

        {approvalCriteriaHasNoAmountRestrictions(approval.approvalCriteria) && <li>No amount restrictions</li>}
      </ul>
      <div style={{ textAlign: 'start' }}>
        {hasSameTrackerId && (
          <>
            <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same amount tracker ID. The tally
            of badges transferred and the number of transfers are linked and will increment whenever either approval is used.
            <br />
          </>
        )}
        {hasSameChallengeTrackerId && (
          <>
            <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same challenge tracker ID.
            {approval.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? ' The whitelists' : ' The codes / passwords'} of these approvals
            are linked and will be used up whenever either approval is used.
          </>
        )}
      </div>
    </InformationDisplayCard>
  );
};

export const MaxNumTransfersComponent = ({
  approval,
  type,
  componentType,
  showUntracked,
  address,
  collectionId,
  hideDisplay,
  trackedBehindTheScenes
}: {
  approval: CollectionApprovalWithDetails<bigint>;
  address?: string;
  hideDisplay?: boolean;
  collectionId: bigint;
  showUntracked?: boolean;
  type: 'overall' | 'to' | 'from' | 'initiatedBy';
  componentType: 'list' | 'card';
  trackedBehindTheScenes?: boolean;
}) => {
  const account = useAccount(address ?? '');
  const collection = useCollection(collectionId);

  if (!approval.approvalCriteria?.maxNumTransfers) return null;

  const maxNumTransfersKey =
    type === 'overall'
      ? 'overallMaxNumTransfers'
      : type === 'to'
        ? 'perToAddressMaxNumTransfers'
        : type === 'from'
          ? 'perFromAddressMaxNumTransfers'
          : 'perInitiatedByAddressMaxNumTransfers';
  const message =
    type === 'overall'
      ? `All approved users cumulatively can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`
      : type === 'to'
        ? `Each unique to address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`
        : type === 'from'
          ? `Each unique from address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`
          : `Each unique approved address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`;
  const untrackedMessage =
    type === 'overall'
      ? `The cumulative number of transfers for all approved users is not tracked`
      : type === 'to'
        ? `The number of transfers for each unique to address is not tracked`
        : type === 'from'
          ? `The number of transfers for each unique from address is not tracked`
          : `The number of transfers for each unique approved address is not tracked`;

  if (
    !(approval.approvalCriteria?.maxNumTransfers && approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0) &&
    !trackedBehindTheScenes
  ) {
    if (componentType === 'list') {
      return null;
    } else {
      return (
        <div className="flex-center flex-column primary-text">
          {
            <>
              {<b>Remaining Uses</b>}
              {!trackedBehindTheScenes && <div className="secondary-text">Not Tracked (No Limit)</div>}
              {trackedBehindTheScenes && <div className="secondary-text">No Limit (Tracked Behind the Scenes)</div>}
            </>
          }
        </div>
      );
    }
  }
  const limit = approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] ?? 0n;

  const numUsed =
    collection?.approvalTrackers.find(
      (y) =>
        y.amountTrackerId === approval.amountTrackerId &&
        y.trackerType === type &&
        y.approvedAddress === (type === 'overall' ? '' : account?.cosmosAddress ?? '')
    )?.numTransfers ?? 0n;

  const numRemaining = limit - numUsed;

  return (
    <>
      {componentType === 'list' && (
        <>
          {approval.approvalCriteria?.maxNumTransfers && approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0 ? (
            <li>{message}</li>
          ) : (
            showUntracked && <li>{untrackedMessage}</li>
          )}
        </>
      )}

      {!hideDisplay && (
        <div className="flex flex-column primary-text" style={{ textAlign: 'center', alignItems: 'normal' }}>
          {approval.approvalCriteria?.maxNumTransfers && (
            <Statistic
              value={`${numRemaining.toString()} / ${!limit ? '?' : approval.approvalCriteria.maxNumTransfers[maxNumTransfersKey].toString()}`}
              title={
                <>
                  {
                    <b className="primary-text" style={{ fontSize: 16 }}>
                      Remaining Uses
                    </b>
                  }
                </>
              }
              className="primary-text"
              style={{ width: '100%', alignItems: 'normal', textAlign: 'center' }}
            />
          )}
        </div>
      )}
    </>
  );
};

export const ApprovalAmountsComponent = ({
  approval,
  address,
  collectionId,
  hideDisplay,
  showUntracked,
  type,
  componentType
}: {
  approval: CollectionApprovalWithDetails<bigint>;
  address?: string;
  collectionId: bigint;
  hideDisplay?: boolean;
  showUntracked?: boolean;
  type: 'overall' | 'to' | 'from' | 'initiatedBy';
  componentType?: 'list' | 'card';
}) => {
  const collection = useCollection(collectionId);
  const account = useAccount(address ?? '');

  if (!approval.approvalCriteria?.approvalAmounts) return null;

  const approvalAmountsKey =
    type === 'overall'
      ? 'overallApprovalAmount'
      : type === 'to'
        ? 'perToAddressApprovalAmount'
        : type === 'from'
          ? 'perFromAddressApprovalAmount'
          : 'perInitiatedByAddressApprovalAmount';
  const message =
    type === 'overall'
      ? `All approved users cumulatively can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`
      : type === 'to'
        ? `Each unique to address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`
        : type === 'from'
          ? `Each unique from address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`
          : `Each unique approved address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`;

  const untrackedMessage =
    type === 'overall'
      ? `The cumulative badges transferred for all approved users is not tracked`
      : type === 'to'
        ? `The badges transferred for each unique to address is not tracked`
        : type === 'from'
          ? `The badges transferred for each unique from address is not tracked`
          : `The badges transferred for each unique approved address is not tracked`;

  if (!(approval.approvalCriteria?.approvalAmounts && approval.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0)) {
    if (componentType === 'list') {
      return null;
    } else {
      return (
        <div className="flex-center flex-column primary-text">
          {
            <>
              {<b>Remaining Amounts</b>}
              <div className="secondary-text">Not Tracked (No Limit)</div>
            </>
          }
        </div>
      );
    }
  }

  const approvedAmounts =
    collection?.approvalTrackers.find(
      (y) =>
        y.amountTrackerId === approval.amountTrackerId &&
        y.trackerType === type &&
        y.approvedAddress === (type === 'overall' ? '' : account?.cosmosAddress ?? '')
    )?.amounts ??
    BalanceArray.From([
      {
        amount: 0n,
        badgeIds: approval.badgeIds,
        ownershipTimes: approval.ownershipTimes
      }
    ]);

  const remainingBalances = BalanceArray.From([
    {
      amount: approval.approvalCriteria.approvalAmounts[approvalAmountsKey],
      badgeIds: approval.badgeIds,
      ownershipTimes: approval.ownershipTimes
    }
  ])
    .clone()
    .subtractBalances(approvedAmounts, true);

  return (
    <>
      {componentType === 'list' && (
        <>
          <>
            {approval.approvalCriteria?.approvalAmounts && approval.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0 ? (
              <li>{message}</li>
            ) : (
              showUntracked && <li>{untrackedMessage}</li>
            )}
          </>
        </>
      )}
      {!hideDisplay && (
        <div className="flex-center flex-column primary-text">
          {<>{<b>Remaining Amounts</b>}</>}

          <BalanceDisplay message={<></>} hideBadges balances={remainingBalances} collectionId={collectionId} />
        </div>
      )}
    </>
  );
};
