import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Divider, Typography } from "antd";
import { AddressList } from "bitbadgesjs-proto";
import { invertUintRanges, isInAddressList } from "bitbadgesjs-utils";

import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressListSelect } from "../../address/AddressListsSelect";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { RequiredApprovalProps } from "../ApprovalSelect";
import { getBadgesWithLockedSupply } from "../../../bitbadges-api/utils/badges";

export const AddressListSelectComponent = ({
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
  const key = type === 'to' ? 'toList' : type === 'initiatedBy' ? 'initiatedByList' : 'fromList';
  const idKey = type === 'to' ? 'toListId' : type === 'initiatedBy' ? 'initiatedByListId' : 'fromListId';

  const list = approvalToAdd[key];
  const setList = (list: AddressList) => {

    setApprovalToAdd({
      ...approvalToAdd,
      [key]: list,
      [idKey]: list.listId,
    });
  }

  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  const lockedBadgeIds = getBadgesWithLockedSupply(collection, undefined, undefined, 'always');
  const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

  const isLockedFromList = key === 'fromList' && approvalToAdd.fromList?.allowlist && approvalToAdd.fromList?.addresses?.length == 1 && disabled;
  const firstAddress = approvalToAdd.fromList?.addresses?.[0];

  return <>
    <AddressListSelect
      addressList={list}
      setAddressList={setList}
      disabled={disabled}
      showErrorOnEmpty
      allowMintSearch={type === 'from'}
    />
    {!disabled && <>
      <div className='secondary-text'>
        <InfoCircleOutlined /> Each added address increases your transaction fee{type === 'initiatedBy' && list.allowlist ? ' if stored on-chain' : ''}.
      </div> </>}

    {isLockedFromList && <>
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
    {key === 'fromList' && nonMintOnlyApproval && isInAddressList(list, 'Mint') && <>
      <div style={{ color: 'red' }}>
        <WarningOutlined /> Please remove the Mint address from the list of possible senders.
      </div>
    </>}
    <Divider />
  </>
}