import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Typography, Divider } from "antd";
import { AddressMapping, UintRange } from "bitbadgesjs-proto";
import { castBalancesActionPermissionToUniversalPermission, BalancesActionPermissionUsedFlags, sortUintRangesAndMergeIfNecessary, invertUintRanges, isInAddressMapping } from "bitbadgesjs-utils";

import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressMappingSelect } from "../../address/AddressMappingSelect";
import { BalanceDisplay } from "../../badges/balances/BalanceDisplay";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { RequiredApprovalProps } from "../ApprovalSelect";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

export const AddressMappingSelectComponent = ({
  approvalToAdd, setApprovalToAdd,
  type, disabled,
  collectionId,
  nonMintOnlyApproval
}: {
  approvalToAdd: RequiredApprovalProps, setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
  type: 'to' | 'from' | 'initiatedBy', disabled?: boolean, storedOffChain?: boolean,
  collectionId: bigint
  nonMintOnlyApproval?: boolean
}) => {


  const key = type === 'to' ? 'toMapping' : type === 'initiatedBy' ? 'initiatedByMapping' : 'fromMapping';
  const idKey = type === 'to' ? 'toMappingId' : type === 'initiatedBy' ? 'initiatedByMappingId' : 'fromMappingId';

  const mapping = approvalToAdd[key];
  const setMapping = (mapping: AddressMapping) => {

    setApprovalToAdd({
      ...approvalToAdd,
      [key]: mapping,
      [idKey]: mapping.mappingId,
    });
  }

  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  const lockedBadges = getPermissionDetails(
    castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []),
    BalancesActionPermissionUsedFlags,
    neverHasManager(collection),
  );
  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary([...lockedBadges.dataSource.map(x => x.forbidden ? x.badgeIds : undefined).filter(x => x !== undefined).flat() as UintRange<bigint>[]], true);
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  return <>
    <AddressMappingSelect
      addressMapping={mapping}
      setAddressMapping={setMapping}
      disabled={disabled}
      showErrorOnEmpty
      allowMintSearch={type === 'from'}
    />
    {!disabled && <>
      <div className=''>
        <InfoCircleOutlined /> Each added address increases your transaction fee{type === 'initiatedBy' && mapping.includeAddresses ? ' if stored on-chain' : ''}.
      </div> </>}

    {key === 'fromMapping' && approvalToAdd.fromMappingId === 'Mint' && <>
      <Typography.Text className='text-gray-400' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> Below is the current balances of the Mint address (including any newly created badges).
        {unlockedBadgeIds.length > 0 && <>
          Also, note that you have selected to be able to create more badges in the future for the following IDs: {getBadgeIdsString(unlockedBadgeIds)}.</>}
      </Typography.Text>
      <BalanceDisplay
        message={'Unminted Balances'}
        hideMessage
        hideBadges
        collectionId={collectionId}
        balances={collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances || []}
      />
    </>
    }
    {key === 'fromMapping' && nonMintOnlyApproval && isInAddressMapping(mapping, 'Mint') && <>
      <div style={{ color: 'red' }}>
        <WarningOutlined /> Please remove the Mint address from the list of possible senders.
      </div>
    </>}
    <Divider />
  </>
}