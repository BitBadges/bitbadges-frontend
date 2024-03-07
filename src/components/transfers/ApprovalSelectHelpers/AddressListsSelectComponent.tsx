import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import { AddressList } from 'bitbadgesjs-sdk';

import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { AddressListSelect } from '../../address/AddressListsSelect';
import { RequiredApprovalProps } from '../ApprovalSelect';

export const AddressListSelectComponent = ({
  approvalToAdd,
  setApprovalToAdd,
  type,
  disabled,
  collectionId,
  nonMintOnlyApproval
}: {
  approvalToAdd: RequiredApprovalProps;
  setApprovalToAdd: (approval: RequiredApprovalProps) => void;
  type: 'to' | 'from' | 'initiatedBy';
  disabled?: boolean;
  storedOffChain?: boolean;
  collectionId: bigint;
  nonMintOnlyApproval?: boolean;
}) => {
  const key = type === 'to' ? 'toList' : type === 'initiatedBy' ? 'initiatedByList' : 'fromList';
  const idKey = type === 'to' ? 'toListId' : type === 'initiatedBy' ? 'initiatedByListId' : 'fromListId';

  const list = approvalToAdd[key];
  const setList = (list: AddressList) => {
    setApprovalToAdd({ ...approvalToAdd, [key]: list, [idKey]: list.listId });
  };

  const collection = useCollection(collectionId);
  if (!collection) return <></>;

  return (
    <>
      <AddressListSelect
        addressList={new AddressList(list)}
        setAddressList={setList}
        disabled={disabled}
        showErrorOnEmpty
        allowMintSearch={type === 'from'}
      />
      {!disabled && key === 'initiatedByList' && list.whitelist && (
        <>
          <div className="secondary-text">
            <InfoCircleOutlined /> For on-chain storage, you cover the cost of storing the list so that all user transactions are cheaper. For
            off-chain storage, user transactions are slightly more expensive, but you do not have to pay for the storage of the list.
          </div>{' '}
        </>
      )}
    
      {key === 'fromList' && nonMintOnlyApproval && new AddressList(list).checkAddress('Mint') && (
        <>
          <div style={{ color: 'red' }}>
            <WarningOutlined /> Please remove the Mint address from the list of possible senders.
          </div>
        </>
      )}
      <Divider />
    </>
  );
};
