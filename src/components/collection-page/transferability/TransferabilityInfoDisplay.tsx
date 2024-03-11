import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Popover, Tag, Tooltip } from 'antd';
import { CollectionApprovalWithDetails } from 'bitbadgesjs-sdk';
import { useMemo } from 'react';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAmountRestrictions, approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../../bitbadges-api/utils/claims';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { getBadgeIdsString } from '../../../utils/badgeIds';
import { getTimeRangesElement } from '../../../utils/dates';
import { AddressDisplayList } from '../../address/AddressDisplayList';
import { TableRow } from '../../display/TableRow';
import { isApprovalNonUpdatableAndExpectsSameValue } from '../../tx-timelines/step-items/CanUpdateCollectionApprovals';
import { PermissionDisplayTable } from '../PermissionsInfo';

export const TableHeader = () => {
  return (
    <tr>
      {
        <>
          <th style={{ verticalAlign: 'top' }}></th>
        </>
      }

      <th style={{ verticalAlign: 'top' }}>
        <b>From</b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>To</b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>
          Approved{' '}
          <Tooltip title="The address that can initiate the transfer transaction.">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>
          Transfer Times
          <Tooltip title="The times at which the transfer can take place.">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>Badge IDs</b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>
          Ownership Times
          <Tooltip title="The ownership times for the badges that are allowed to be transferred.">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </b>
      </th>
      <th style={{ verticalAlign: 'top' }}>
        <b>Tags</b>
      </th>
    </tr>
  );
};

interface TransferabilityInfoProps {
  approval: CollectionApprovalWithDetails<bigint>;
  allApprovals: Array<CollectionApprovalWithDetails<bigint>>;
  filterFromMint?: boolean;
  grayedOut?: boolean;
  onDelete?: (approvalId: string) => void;
  startingApprovals?: Array<CollectionApprovalWithDetails<bigint>>;
  disapproved?: boolean;
  editable?: boolean;
  collectionId: bigint;
  forceMobile?: boolean;
}

interface TransferabilityInfoDisplayProps extends TransferabilityInfoProps {
  toAddresses: string[];
  initiatedByAddresses: string[];
  hasSameChallengeTrackerId?: boolean;
  hasSameTrackerId?: boolean;
}

export const TransferabilityInfoDisplay = (props: TransferabilityInfoProps) => {
  const { approval, allApprovals, onDelete, editable } = props;

  const toAddresses = useMemo(() => {
    return approval.toList.addresses.filter((x) => x !== 'Mint');
  }, [approval.toList.addresses]);

  const initiatedByAddresses = useMemo(() => {
    return approval.initiatedByList.addresses.filter((x) => x !== 'Mint');
  }, [approval.initiatedByList.addresses]);

  //Only show the duplicate warning on edit for edge cases
  const hasApprovalAmounts = approvalHasApprovalAmounts(approval.approvalCriteria?.approvalAmounts);
  const hasMaxNumTransfers = approvalHasMaxNumTransfers(approval.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allApprovals.find(
    (x) =>
      x.amountTrackerId === approval.amountTrackerId &&
      x.approvalId !== approval.approvalId &&
      (onDelete ||
        editable ||
        ((hasApprovalAmounts || hasMaxNumTransfers) &&
          (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))))
  );

  const hasSameChallengeTrackerId = allApprovals.find(
    (x) =>
      x.challengeTrackerId === approval.challengeTrackerId &&
      x.approvalId !== approval.approvalId &&
      (onDelete ||
        editable ||
        (x.approvalCriteria?.merkleChallenge?.root &&
          approval.approvalCriteria?.merkleChallenge?.root &&
          x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf &&
          approval.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf))
  );

  const newProps = {
    ...props,
    toAddresses,
    initiatedByAddresses,
    hasSameChallengeTrackerId: !!hasSameChallengeTrackerId,
    hasSameTrackerId: !!hasSameTrackerId
  };

  if (newProps.forceMobile) {
    return (
      <>
        <br />
        <Col md={24} xs={24} sm={24}>
          <RowContentDetails mobile {...newProps} />
        </Col>
      </>
    );
  }

  return (
    <>
      <br />
      <Col md={0} xs={24} sm={24}>
        <RowContentDetails mobile {...newProps} />
      </Col>
      <Col md={24} xs={0} sm={0}>
        <WideViewContent {...newProps} />
      </Col>
    </>
  );
};

//Wide view display
const WideViewContent = (props: TransferabilityInfoDisplayProps) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="table-auto overflow-x-scroll w-full table-wrp">
          <thead className="sticky top-0 z-10" style={{ zIndex: 10 }}>
            <TableHeader />
          </thead>
          <tbody>
            <RowContentDetails mobile={false} {...props} />
          </tbody>
        </table>
      </div>
    </>
  );
};

//Row display (mobile prop determines narrow or wide view)
const RowContentDetails = ({
  mobile,
  approval,
  filterFromMint,
  grayedOut,
  onDelete,
  startingApprovals,
  disapproved,
  toAddresses,
  initiatedByAddresses,
  hasSameChallengeTrackerId,
  hasSameTrackerId,
  collectionId,
  forceMobile
}: TransferabilityInfoDisplayProps & { mobile?: boolean }) => {
  const collection = useCollection(collectionId);
  const FromValue = (
    <AddressDisplayList users={approval.fromList.addresses} allExcept={!approval.fromList.whitelist} fontSize={16} filterMint={filterFromMint} />
  );

  const ToValue = <AddressDisplayList users={toAddresses} allExcept={!approval.toList.whitelist} filterMint fontSize={16} />;

  const InitiatedByValue = (
    <AddressDisplayList users={initiatedByAddresses} allExcept={!approval.initiatedByList.whitelist} filterMint fontSize={16} />
  );

  const BadgeIdsValue = <> {getBadgeIdsString(approval.badgeIds)}</>;
  const OwnershipTimesValue = <> {getTimeRangesElement(approval.ownershipTimes, '', true)}</>;
  const TransferTimesValue = <> {getTimeRangesElement(approval.transferTimes, '', true)}</>;

  const isExisting = startingApprovals?.find((x) => x.approvalId === approval.approvalId);
  const isReservedApproval = approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming';

  const TagsValue = (
    <>
      {' '}
      {!disapproved && (
        <div style={{ alignItems: 'center', height: '100%' }} className="flex-center flex-wrap flex-column">
          {onDelete && !isReservedApproval && (
            <>
              {isExisting ? (
                <Tag style={{ margin: 4, backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
                  Existing
                </Tag>
              ) : (
                <Tag style={{ margin: 4, backgroundColor: '#52c41a' }} color="#52c41a" className="primary-text">
                  New
                </Tag>
              )}
            </>
          )}

          {grayedOut && (
            <Tag style={{ margin: 4, backgroundColor: '#FF5733' }} color="#FF5733" className="primary-text">
              Deleted
            </Tag>
          )}

          {approvalCriteriaHasNoAmountRestrictions(approval.approvalCriteria) && (
            <Tag style={{ margin: 4, backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
              No Amount Restrictions
            </Tag>
          )}
          {collection && (isApprovalNonUpdatableAndExpectsSameValue(approval, collection) || neverHasManager(collection)) && (
            <Popover
              color="black"
              content={
                <div className="dark primary-text">
                  <PermissionDisplayTable
                    permissions={collection.collectionPermissions.canUpdateCollectionApprovals}
                    permissionName={'canUpdateCollectionApprovals'}
                    neverHasManager={neverHasManager(collection)}
                  />
                </div>
              }>
              <Tag
                style={{
                  margin: 4,
                  backgroundColor: 'black',
                  textAlign: 'center',
                  color: 'white',
                  alignItems: 'center'
                }}
                className="primary-text ">
                <FontAwesomeIcon icon={faSnowflake} /> Frozen
              </Tag>
            </Popover>
          )}
          {approval.approvalCriteria?.merkleChallenge?.root && approval.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf && (
            <Tag style={{ margin: 4, backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
              Whitelist
            </Tag>
          )}

          {approval.details?.offChainClaims?.find((x) => x.plugins.find((plugin) => plugin.id === 'codes')) && (
            <Tag style={{ margin: 4, backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
              Codes
            </Tag>
          )}

          {approval.details?.offChainClaims?.find((x) => x.plugins.find((plugin) => plugin.id === 'password')) && (
            <Tag style={{ margin: 4, backgroundColor: '#df3372' }} color="#1890ff" className="primary-text">
              Password
            </Tag>
          )}
          {approval.approvalCriteria?.overridesFromOutgoingApprovals && approval.fromListId !== 'Mint' && (
            <Tag style={{ margin: 4, backgroundColor: '#FF5733' }} color="#1890ff" className="primary-text">
              <WarningOutlined /> Overrides Outgoing Approvals
            </Tag>
          )}
          {approval.approvalCriteria?.overridesToIncomingApprovals && (
            <Tag style={{ margin: 4, backgroundColor: '#FF5733' }} color="#1890ff" className="primary-text">
              <WarningOutlined /> Overrides Incoming Approvals
            </Tag>
          )}
          {hasSameChallengeTrackerId && (
            <Tag style={{ margin: 4, backgroundColor: '#FF5733' }} color="#1890ff" className="primary-text">
              <WarningOutlined /> Duplicate Challenge Tracker
            </Tag>
          )}
          {hasSameTrackerId && (
            <Tag style={{ margin: 4, backgroundColor: '#FF5733' }} color="#1890ff" className="primary-text">
              <WarningOutlined /> Duplicate Amount Tracker
            </Tag>
          )}

          {(approval.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n) > 0n ||
            ((approval.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n) > 0n && (
              <Tag style={{ margin: 4, backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
                Incrementing Badge IDs
              </Tag>
            ))}
        </div>
      )}
      {!disapproved ? (
        <td></td>
      ) : (
        <td className="flex-center">
          <Tag style={{ margin: 4, backgroundColor: 'red' }} color="#1890ff" className="primary-text">
            Disapproved
          </Tag>{' '}
        </td>
      )}
    </>
  );

  if (mobile || forceMobile) {
    return (
      <>
        <TableRow label={'From'} value={FromValue} mobileFormat={forceMobile} />
        <TableRow label={'To'} value={ToValue} mobileFormat={forceMobile} />
        <TableRow label={'Initiated By'} value={InitiatedByValue} mobileFormat={forceMobile} />
        <TableRow label={'Badge IDs'} value={BadgeIdsValue} mobileFormat={forceMobile} />
        <TableRow label={'Ownership Times'} value={OwnershipTimesValue} mobileFormat={forceMobile} />
        <TableRow label={'Transfer Times'} value={TransferTimesValue} mobileFormat={forceMobile} />
        <TableRow label={'Tags'} value={TagsValue} mobileFormat={forceMobile} />
      </>
    );
  }

  return (
    <tr style={{ opacity: grayedOut ? 0.5 : undefined, fontWeight: 'bold', fontSize: 16 }}>
      {!disapproved ? (
        <td>
          {
            <span style={{ fontSize: 20, marginLeft: 4, marginRight: 24, color: 'green' }}>
              <CheckCircleFilled />
            </span>
          }
        </td>
      ) : (
        <td>
          {
            <span style={{ fontSize: 20, marginLeft: 4, marginRight: 24, color: 'red' }}>
              <CloseCircleFilled />
            </span>
          }{' '}
        </td>
      )}

      <td style={{ alignItems: 'center' }}>{FromValue}</td>
      <td style={{ alignItems: 'center' }}>{ToValue}</td>
      <td style={{ alignItems: 'center' }}>{InitiatedByValue}</td>

      <td style={{ alignItems: 'center' }}>{TransferTimesValue}</td>
      <td style={{ alignItems: 'center' }}>{BadgeIdsValue}</td>
      <td style={{ alignItems: 'center' }}>{OwnershipTimesValue}</td>

      <td style={{ alignItems: 'center' }}>{TagsValue}</td>
    </tr>
  );
};
