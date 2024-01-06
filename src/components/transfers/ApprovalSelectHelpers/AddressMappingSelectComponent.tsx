import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Divider, Typography } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { invertUintRanges, isInAddressMapping } from "bitbadgesjs-utils";

import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressMappingSelect } from "../../address/AddressMappingSelect";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { RequiredApprovalProps } from "../ApprovalSelect";
import { getBadgesWithLockedSupply } from "../../../bitbadges-api/utils/badges";

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

  const lockedBadgeIds = getBadgesWithLockedSupply(collection, undefined, undefined, 'always');
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  const isLockedFromMapping = key === 'fromMapping' && approvalToAdd.fromMapping?.includeAddresses && approvalToAdd.fromMapping?.addresses?.length == 1 && disabled;
  const firstAddress = approvalToAdd.fromMapping?.addresses?.[0];

  return <>
    <AddressMappingSelect
      addressMapping={mapping}
      setAddressMapping={setMapping}
      disabled={disabled}
      showErrorOnEmpty
      allowMintSearch={type === 'from'}
    />
    {!disabled && <>
      <div className='secondary-text'>
        <InfoCircleOutlined /> Each added address increases your transaction fee{type === 'initiatedBy' && mapping.includeAddresses ? ' if stored on-chain' : ''}.
      </div> </>}

    {isLockedFromMapping && <>
      <div className='primary-text flex-center flex-column'>
        <BalanceDisplay
          collectionId={collectionId}
          hideMessage
          balances={collection.owners.find(x => x.cosmosAddress === firstAddress)?.balances ?? []}
        />
      </div>
      <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> This is the current balances of this address
        {firstAddress !== 'Mint' ? '.' : <>
          {' '}(including any newly created badges).
          {unlockedBadgeIds.length > 0 && <>
            You have also selected to be able to create more badges in the future for the following IDs: {getBadgeIdsString(unlockedBadgeIds)}.</>}
        </>}
      </Typography.Text>
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