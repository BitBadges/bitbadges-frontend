import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  DownOutlined,
  InfoCircleOutlined,
  QuestionCircleFilled,
  UpOutlined
} from '@ant-design/icons';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover, Switch } from 'antd';
import { AddressList, UintRangeArray, iCollectionPermissionsWithDetails } from 'bitbadgesjs-sdk';

import { useState } from 'react';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../bitbadges-api/utils/manager';
import { CleanedPermissionDetails, GenericCollectionPermissionWithDetails, getDetailsForPermission } from '../../bitbadges-api/utils/permissions';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { getTimeRangesElement } from '../../utils/dates';
import { AddressDisplayList } from '../address/AddressDisplayList';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { AfterPermission } from '../tx-timelines/form-items/BeforeAfterPermission';

const PermissionTableRow = ({
  permission,
  columns,
  onFreezePermitted,
  setPermissions,
  idx,
  permissions
}: {
  permission: CleanedPermissionDetails;

  columns: Array<{
    title: string;
    dataIndex: string;
    key: string;
  }>;
  onFreezePermitted?: (frozen: boolean) => void;
  setPermissions?: (permissions: GenericCollectionPermissionWithDetails[]) => void;
  idx?: number;
  permissions?: GenericCollectionPermissionWithDetails[];
}) => {
  const y = permission;

  return (
    <tr className="primary-border">
      {!!setPermissions && permissions && idx !== undefined && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{idx + 1}</td>}
      {!!setPermissions && permissions && idx !== undefined && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <div className="flex">
            {idx > 0 && idx != permissions.length && (
              <IconButton
                src={<UpOutlined />}
                onClick={() => {
                  const newPermissions = [...permissions];
                  const temp = newPermissions[idx];
                  newPermissions[idx] = newPermissions[idx - 1];
                  newPermissions[idx - 1] = temp;
                  setPermissions?.(newPermissions);
                }}
                text="Up"
              />
            )}
            {idx < permissions.length - 1 && (
              <IconButton
                src={<DownOutlined color="white" style={{ color: 'white' }} />}
                onClick={() => {
                  const newPermissions = [...permissions];
                  const temp = newPermissions[idx];
                  newPermissions[idx] = newPermissions[idx + 1];
                  newPermissions[idx + 1] = temp;
                  setPermissions?.(newPermissions);
                }}
                text="Down"
              />
            )}

            <IconButton
              disabled={idx == permissions.length}
              src={<DeleteOutlined />}
              onClick={() => {
                let newPermissions = [...permissions];
                newPermissions = newPermissions.filter((_, i) => i !== idx);
                setPermissions?.(newPermissions);
              }}
              text="Delete"
            />
          </div>
        </td>
      )}
      {y.forbidden && !y.permitted && (
        <>
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <CloseCircleFilled style={{ color: 'red' }} />{' '}
          </td>{' '}
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <div className="flex-center">
              {onFreezePermitted ? (
                <Switch style={{ marginRight: 8 }} checked={true} checkedChildren={<FontAwesomeIcon icon={faSnowflake} />} disabled />
              ) : (
                <FontAwesomeIcon icon={faSnowflake} />
              )}
            </div>
          </td>
        </>
      )}
      {y.permitted && !y.forbidden && (
        <>
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <CheckCircleFilled style={{ color: 'green' }} />
          </td>{' '}
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <div
              className="flex-center"
              onClick={(e) => {
                e.stopPropagation();
              }}>
              {onFreezePermitted ? (
                <Switch
                  style={{ marginRight: 8 }}
                  checked={true}
                  checkedChildren={<FontAwesomeIcon icon={faSnowflake} />}
                  onChange={() => {
                    onFreezePermitted?.(false);
                  }}
                />
              ) : (
                <FontAwesomeIcon icon={faSnowflake} />
              )}
            </div>
          </td>
        </>
      )}
      {!y.permitted && !y.forbidden && (
        <>
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <CheckCircleFilled style={{ color: 'green' }} />{' '}
          </td>{' '}
          <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
            <div
              className="flex-center"
              onClick={(e) => {
                e.stopPropagation();
              }}>
              {onFreezePermitted ? (
                <Switch
                  style={{ marginRight: 8 }}
                  checked={false}
                  unCheckedChildren={<>No</>}
                  onChange={() => {
                    onFreezePermitted?.(true);
                  }}
                />
              ) : (
                <>No</>
              )}
            </div>
          </td>
        </>
      )}
      {y.permissionTimes && (
        <td
          style={{
            padding: 8,
            fontWeight: 'bold',
            fontSize: 16,
            borderRight: columns.length > 3 ? '1px solid' : undefined
          }}>
          {getTimeRangesElement(y.permissionTimes, '', true, false, false)}
        </td>
      )}

      {y.fromList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.fromList.addresses} allExcept={!y.fromList.whitelist} />
        </td>
      )}
      {y.toList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.toList.addresses} allExcept={!y.toList.whitelist} filterMint />
        </td>
      )}

      {y.initiatedByList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.initiatedByList.addresses} allExcept={!y.initiatedByList.whitelist} filterMint />
        </td>
      )}
      {y.timelineTimes && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.timelineTimes, '', true, false, false)}</td>
      )}
      {y.badgeIds && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getBadgeIdsString(y.badgeIds)}</td>}
      {y.ownershipTimes && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.ownershipTimes, '', true, false, false)}</td>
      )}
      {y.transferTimes && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>{getTimeRangesElement(y.transferTimes, '', true, false, false)}</td>
      )}

      {y.approvalIdList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.approvalIdList.addresses} allExcept={!y.approvalIdList.whitelist} filterMint trackerIdList />
        </td>
      )}

      {y.amountTrackerIdList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.amountTrackerIdList.addresses} allExcept={!y.amountTrackerIdList.whitelist} filterMint trackerIdList />
        </td>
      )}

      {y.challengeTrackerIdList && (
        <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>
          <AddressDisplayList users={y.challengeTrackerIdList.addresses} allExcept={!y.challengeTrackerIdList.whitelist} filterMint trackerIdList />
        </td>
      )}
    </tr>
  );
};

export const PermissionDisplayTable = ({
  permissions,
  permissionName,
  neverHasManager,
  badgeIds,
  mintOnly,
  nonMintOnly,
  onFreezePermitted,
  editMode,
  setPermissions
}: {
  permissions: GenericCollectionPermissionWithDetails[];
  setPermissions?: (permissions: GenericCollectionPermissionWithDetails[]) => void;
  neverHasManager: boolean;
  badgeIds?: UintRangeArray<bigint>;
  mintOnly?: boolean;
  nonMintOnly?: boolean;
  onFreezePermitted?: (frozen: boolean) => void;
  editMode?: boolean;
  permissionName: PermissionNameString;
}) => {
  const { columns, dataSource } = getDetailsForPermission(permissions, permissionName, badgeIds, editMode);
  const hasPermitted = dataSource.find((x) => !x.forbidden);
  const hasForbidden = dataSource.find((x) => x.forbidden && !x.permitted);
  const hasBothPermittedAndForbidden = hasPermitted && hasForbidden;

  const [showForbidden, setShowForbidden] = useState<boolean>(editMode ? true : !hasPermitted ? true : false);

  if (!editMode) {
    dataSource.sort((a) => {
      return a.forbidden ? 1 : -1;
    });
  }

  return (
    <>
      <div
        className="full-width primary-text"
        style={{
          textAlign: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div className="" style={{ alignItems: 'normal', width: '100%' }}>
          {neverHasManager ? (
            <p>
              <InfoCircleOutlined />
              {` There is and will never be a manager for this collection, so this permission can never be executed.`}
            </p>
          ) : (
            <>
              <div style={{ textAlign: 'center' }} className="primary-text flex-center ">
                {/* <Typography.Text strong style={{ fontSize: 20, textAlign: 'center' }} className='primary-text'>{question} </Typography.Text> */}
                {/* <br /> */}
                <br />

                <div className="primary-text" style={{ textAlign: 'center', overflow: 'auto' }}>
                  <div>
                    <table className="table-auto overflow-x-scroll">
                      {hasBothPermittedAndForbidden && !editMode && (
                        <>
                          <tr>
                            <td colSpan={1000}>
                              <div style={{ float: 'right' }}>
                                <Switch
                                  checked={showForbidden}
                                  onChange={(checked) => {
                                    setShowForbidden(checked);
                                  }}
                                  checkedChildren={<>Show Forbidden</>}
                                  unCheckedChildren={<>Show Permitted Only</>}
                                />
                              </div>
                            </td>
                          </tr>
                          <br />
                        </>
                      )}

                      <tr className="primary-border">
                        {editMode && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}>Priority</td>}
                        {editMode && <td style={{ padding: 8, fontWeight: 'bold', fontSize: 16 }}></td>}

                        {columns.map((x, idx) => {
                          return (
                            <td
                              key={x.key}
                              style={{
                                padding: 8,
                                fontWeight: 'bold',
                                fontSize: 16,
                                borderRight: idx === 2 && columns.length > 3 ? '1px solid' : undefined,
                                verticalAlign: 'top',
                                minWidth: 70
                              }}>
                              {x.title}
                            </td>
                          );
                        })}
                      </tr>
                      {dataSource.map((y, idx) => {
                        if (hasBothPermittedAndForbidden) {
                          if (y.forbidden && !showForbidden) {
                            return null;
                          }
                        }

                        if (mintOnly && (!y.fromList || !y.fromList.checkAddress('Mint'))) {
                          return null;
                        }

                        if (nonMintOnly && y.fromList.addresses.length === 1 && y.fromList.addresses[0] === 'Mint' && y.fromList.whitelist) {
                          return null;
                        }

                        if (mintOnly) {
                          y.fromList = AddressList.Reserved('Mint');
                        }

                        if (badgeIds) {
                          y.badgeIds = badgeIds.getOverlaps(y.badgeIds ?? []);
                        }

                        //we previously may have filtered out columns, here we should not display them
                        const columnKeys = columns.map((x) => x.key);

                        //delete everything from y that doesn't have a corresponding column
                        for (const key of Object.keys(y)) {
                          if (key == 'permitted' || key == 'forbidden' || key == 'permissionTimes') continue;
                          if (!columnKeys.includes(key)) {
                            delete y[key as keyof typeof y];
                          }
                        }

                        return (
                          <PermissionTableRow
                            key={idx}
                            idx={idx}
                            permissions={permissions}
                            permission={y}
                            columns={columns}
                            onFreezePermitted={onFreezePermitted}
                            setPermissions={setPermissions}
                          />
                        );
                      })}
                    </table>
                  </div>
                </div>
              </div>
              {
                <>
                  <br />
                  <div className="full-width secondary-text">
                    <InfoCircleOutlined style={{ marginRight: 4 }} /> If a value is frozen, it is non-updatable and can NEVER be updated in the
                    future.
                  </div>
                </>
              }
            </>
          )}
        </div>

        {columns.find((x) => x.key === 'approvalIdList' || x.key === 'amountTrackerIdList' || x.key === 'challengeTrackerIdList') && (
          <>
            <br />
            <div className="full-width secondary-text">
              <InfoCircleOutlined style={{ marginRight: 4 }} /> IDs are used for locking specific approvals / transferability.
            </div>
          </>
        )}

        {badgeIds != undefined && (
          <p>
            <br />
            {`*Permissions were filtered to only include certain badges (${getBadgeIdsString(badgeIds)}).`}
          </p>
        )}
      </div>
    </>
  );
};
export type PermissionNameString =
  | 'canDeleteCollection'
  | 'canArchiveCollection'
  | 'canUpdateOffChainBalancesMetadata'
  | 'canUpdateBadgeMetadata'
  | 'canUpdateCollectionMetadata'
  | 'canCreateMoreBadges'
  | 'canUpdateCollectionApprovals'
  | 'canUpdateAutoApproveSelfInitiatedIncomingTransfers'
  | 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers'
  | 'canUpdateStandards'
  | 'canUpdateCustomData'
  | 'canUpdateManager';

export const PermissionIcon = ({
  permissions,
  permissionName,
  neverHasManager,
  badgeIds
}: {
  permissionName: PermissionNameString;
  permissions: GenericCollectionPermissionWithDetails[];
  neverHasManager: boolean;
  badgeIds?: UintRangeArray<bigint>;
}) => {
  const { hasPermanentlyPermittedTimes, hasNeutralTimes, hasPermanentlyForbiddenTimes } = getDetailsForPermission(
    permissions,
    permissionName,
    badgeIds
  );

  return (
    <>
      <Popover
        color="black"
        className="primary-text inherit-bg"
        content={
          <>
            <div className="dark primary-text">
              <PermissionDisplayTable
                permissions={permissions}
                permissionName={permissionName}
                neverHasManager={neverHasManager}
                badgeIds={badgeIds}
              />
            </div>
          </>
        }>
        {!(hasPermanentlyForbiddenTimes && !hasNeutralTimes && !hasPermanentlyPermittedTimes) &&
          !(hasPermanentlyPermittedTimes && !hasNeutralTimes && !hasPermanentlyForbiddenTimes) &&
          !neverHasManager && (
            <>
              <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
              {hasPermanentlyForbiddenTimes && <CloseCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />}
              {/* <ClockCircleFilled style={{ marginLeft: 4, fontSize: 18 }} /> */}
            </>
          )}
        {(neverHasManager || (hasPermanentlyForbiddenTimes && !hasNeutralTimes && !hasPermanentlyPermittedTimes)) && (
          <>
            <CloseCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'red' }} />
            <FontAwesomeIcon icon={faSnowflake} style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} />
          </>
        )}
        {hasPermanentlyPermittedTimes && !hasNeutralTimes && !hasPermanentlyForbiddenTimes && !neverHasManager && (
          <>
            <CheckCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'green' }} />
            <FontAwesomeIcon icon={faSnowflake} style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} />
          </>
        )}
      </Popover>
    </>
  );
};

export function UserPermissionsOverview({
  collectionId,
  addressOrUsername,
  displayDefaults
}: {
  collectionId: bigint;
  addressOrUsername: string;
  displayDefaults?: boolean;
}) {
  const collection = useCollection(collectionId);
  const account = useAccount(addressOrUsername);
  const permissions = displayDefaults
    ? collection?.defaultBalances.userPermissions
    : collection?.owners.find((x) => x.cosmosAddress === account?.cosmosAddress)?.userPermissions;
  if (!permissions || !account) return <></>;

  //We cast to collection approval permission for compatibility with other components
  const incomingToCollectionCasted = permissions.canUpdateIncomingApprovals.map((x) => x.castToCollectionApprovalPermission(account.address));
  const outgoingToCollectionCasted = permissions.canUpdateOutgoingApprovals.map((x) => x.castToCollectionApprovalPermission(account.address));

  return (
    <InformationDisplayCard title={'User Permissions'} md={12} xs={24} sm={24}>
      <TableRow
        label={'Update incoming approvals?'}
        value={<PermissionIcon permissions={incomingToCollectionCasted} permissionName="canUpdateCollectionApprovals" neverHasManager={false} />}
        labelSpan={18}
        valueSpan={6}
      />

      <TableRow
        label={'Update outgoing approvals?'}
        value={<PermissionIcon permissions={outgoingToCollectionCasted} permissionName="canUpdateCollectionApprovals" neverHasManager={false} />}
        labelSpan={18}
        valueSpan={6}
      />

      <TableRow
        label={'Update auto-approve self-initiated transfers (incoming)?'}
        value={
          <PermissionIcon
            permissions={permissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers}
            permissionName="canUpdateAutoApproveSelfInitiatedIncomingTransfers"
            neverHasManager={false}
          />
        }
        labelSpan={18}
        valueSpan={6}
      />

      <TableRow
        label={'Update auto-approve self-initiated transfers (outgoing)?'}
        value={
          <PermissionIcon
            permissions={permissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers}
            permissionName="canUpdateAutoApproveSelfInitiatedOutgoingTransfers"
            neverHasManager={false}
          />
        }
        labelSpan={18}
        valueSpan={6}
      />
    </InformationDisplayCard>
  );
}

export function PermissionsOverview({
  collectionId,
  span,
  badgeId,
  tbd,
  permissionName,
  onFreezePermitted
}: {
  collectionId: bigint;
  span?: number;
  badgeId?: bigint;
  tbd?: boolean;
  permissionName?: PermissionNameString;
  onFreezePermitted?: (frozen: boolean) => void;
}) {
  const collection = useCollection(collectionId);

  if (!collection?.collectionPermissions) return <></>;

  const noManager = neverHasManager(collection);
  const isBadgeView = badgeId !== undefined;
  const badgeIds = isBadgeView ? UintRangeArray.From([{ start: badgeId, end: badgeId }]) : undefined;
  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');

  const permissionNames: PermissionNameString[] = [
    'canCreateMoreBadges',
    'canUpdateCollectionApprovals',
    'canUpdateOffChainBalancesMetadata',
    'canUpdateBadgeMetadata',
    'canUpdateCollectionMetadata',
    'canDeleteCollection',
    'canArchiveCollection',
    'canUpdateStandards',
    'canUpdateCustomData'
  ];

  const balancePermissions: PermissionNameString[] = ['canCreateMoreBadges', 'canUpdateCollectionApprovals', 'canUpdateOffChainBalancesMetadata'];

  const hideOnBadgeViewPermissions: PermissionNameString[] = [
    'canUpdateCollectionMetadata',
    'canDeleteCollection',
    'canArchiveCollection',
    'canUpdateStandards',
    'canUpdateCustomData',
    'canUpdateManager'
  ];

  const getQuestion = (name: PermissionNameString) => {
    switch (name) {
      case 'canCreateMoreBadges':
        return 'Create more badges?';
      case 'canUpdateCollectionApprovals':
        return 'Update collection transferability?';
      case 'canUpdateOffChainBalancesMetadata':
        return 'Update balances URL?';
      case 'canUpdateBadgeMetadata':
        return 'Update badge metadata URL?';
      case 'canUpdateCollectionMetadata':
        return 'Update collection metadata URL?';
      case 'canDeleteCollection':
        return 'Delete collection?';
      case 'canArchiveCollection':
        return 'Archive collection?';
      case 'canUpdateStandards':
        return 'Update standards?';
      case 'canUpdateCustomData':
        return 'Update custom data?';
      default:
        return '';
    }
  };

  return (
    <InformationDisplayCard title={permissionName ? '' : 'Manager Permissions'} span={span}>
      {permissionNames.map((name) => {
        if (!permissionName || permissionName == name) {
          const question = getQuestion(name);

          if (noBalancesStandard && balancePermissions.includes(name)) return null;
          if (collection.balancesType === 'Standard' && name === 'canUpdateOffChainBalancesMetadata') return null;
          if (collection.balancesType === 'Off-Chain - Indexed' || collection.balancesType === 'Off-Chain - Non-Indexed') {
            if (name === 'canCreateMoreBadges') return null;
            if (name === 'canUpdateCollectionApprovals') return null;
          }
          if (isBadgeView && hideOnBadgeViewPermissions.includes(name)) return null;

          return (
            <TableRow
              key={name}
              label={question}
              value={
                tbd ? (
                  <QuestionCircleFilled style={{ marginLeft: 4, fontSize: 18, color: 'lightblue' }} />
                ) : (
                  <PermissionIcon
                    permissions={collection.collectionPermissions[name as keyof iCollectionPermissionsWithDetails<bigint>]}
                    neverHasManager={noManager}
                    badgeIds={badgeIds}
                    permissionName={name}
                  />
                )
              }
              labelSpan={18}
              valueSpan={6}
            />
          );
        } else {
          return null;
        }
      })}

      {permissionName && (
        <>
          <br />
          <AfterPermission permissionName={permissionName} onFreezePermitted={onFreezePermitted} />
        </>
      )}
    </InformationDisplayCard>
  );
}
