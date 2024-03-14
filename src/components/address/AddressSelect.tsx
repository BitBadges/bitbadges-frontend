import { Dropdown, Input } from 'antd';
import { useState } from 'react';

import { InfoCircleOutlined, MinusOutlined, EditOutlined } from '@ant-design/icons';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { getAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { Divider } from '../display/Divider';
import IconButton from '../display/IconButton';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { AddressDisplay } from './AddressDisplay';

export enum EnterMethod {
  Single = 'Single',
  Batch = 'Batch'
}

export function AddressSelect({
  addressOrUsername,
  onUserSelect,
  disabled,
  allowMintSearch,
  switchable = true,
  fontSize
}: {
  addressOrUsername?: string;
  onUserSelect: (currUserInfo: string) => void;
  disabled?: boolean;
  allowMintSearch?: boolean;
  switchable?: boolean;
  fontSize?: number;
}) {
  const defaultAccount = useAccount(addressOrUsername);
  const chain = useChainContext();

  const [changed, setChanged] = useState<boolean>(false);
  const [input, setInput] = useState<string>(defaultAccount ? defaultAccount?.address : '');
  const [showSelect, setShowSelect] = useState<boolean>(switchable ? false : true);
  const [latestAddress, setLatestAddress] = useState<string | undefined>(defaultAccount?.address);

  const AddressInput = (
    <Dropdown
      open={changed && input != ''}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyAddresses
          allowMintSearch={allowMintSearch}
          searchValue={input}
          onSearch={async (value: string) => {
            const acc = getAccount(value);
            if (!acc) return;

            onUserSelect(acc?.address);
            setInput('');
            setLatestAddress(acc?.address);
            setShowSelect(switchable ? false : true);
          }}
        />
      }
      trigger={['hover', 'click']}>
      <Input
        value={input}
        placeholder="Enter an address or username"
        className="primary-text inherit-bg"
        style={{ textAlign: 'center' }}
        onChange={async (e) => {
          e.preventDefault();
          setInput(e.target.value);
          setChanged(true);
        }}
        disabled={disabled}
      />
    </Dropdown>
  );

  return (
    <>
      <div className="full-width">
        {switchable && (
          <div className="flex-center flex-wrap primary-text">
            <AddressDisplay addressOrUsername={latestAddress ?? ''} fontSize={fontSize} />{' '}
            <IconButton
              secondary
              disabled={disabled}
              hideText
              src={showSelect ? <MinusOutlined /> : <EditOutlined />}
              style={{ marginLeft: 4 }}
              text="Switch"
              onClick={() => {
                setShowSelect(!showSelect);
              }}
            />
          </div>
        )}
        {showSelect && (
          <>
            <br />
            <b>Select Address</b>
            {AddressInput}
            <div className="secondary-text" style={{ textAlign: 'left', marginTop: 4 }}>
              <div className="flex-center flex-wrap" style={{ alignItems: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 3 }} /> Suggested addresses:
                <div className="mx-2">
                  <AddressDisplay addressOrUsername={chain.address} fontSize={12} hidePortfolioLink />
                </div>
                {allowMintSearch && (
                  <div className="mr-4">
                    <AddressDisplay addressOrUsername={'Mint'} fontSize={12} hidePortfolioLink />
                  </div>
                )}
              </div>
            </div>
            <Divider />
          </>
        )}
      </div>
    </>
  );
}
