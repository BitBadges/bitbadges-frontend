import { Dropdown, Input } from 'antd';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { MinusOutlined, SwapOutlined } from '@ant-design/icons';
import IconButton from '../display/IconButton';
import { AddressDisplay } from './AddressDisplay';

export enum EnterMethod {
  Single = 'Single',
  Batch = 'Batch',
}

export function AddressSelect({
  defaultValue,
  onUserSelect,
  disabled,
  allowMintSearch,
  switchable = true
}: {
  defaultValue?: string,
  onUserSelect: (currUserInfo: string) => void,
  disabled?: boolean,
  allowMintSearch?: boolean
  switchable?: boolean
}) {
  const accounts = useAccountsContext();
  const defaultAccount = defaultValue ? accounts.getAccount(defaultValue) : undefined;

  const [changed, setChanged] = useState<boolean>(false);
  const [input, setInput] = useState<string>(defaultAccount ? defaultAccount?.address : '');
  const [showSelect, setShowSelect] = useState<boolean>(switchable ? false : true);
  const [latestAddress, setLatestAddress] = useState<string | undefined>(defaultAccount?.address);

  const AddressInput = <Input.Group compact className='flex'>
    <Dropdown
      open={changed && input != ''}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyAddresses
          allowMintSearch={allowMintSearch}
          searchValue={input}
          onSearch={async (value: string | BitBadgesUserInfo<bigint>) => {
            if (typeof value === "string") return

            onUserSelect(value.address);
            setInput('');
            setLatestAddress(value.address);
            setShowSelect(switchable ? false : true);
          }}
        />
      }
      trigger={['hover', 'click']}
    >
      <Input
        value={input}
        className='dark:text-white inherit-bg'
        onChange={async (e) => {
          e.preventDefault();
          setInput(e.target.value);
          setChanged(true);
        }}
        disabled={disabled}
      />
    </Dropdown>
  </Input.Group>


  return <>
    <div className='full-width'>
      {switchable &&
        <div className='flex-center flex-wrap dark:text-white'>
          <AddressDisplay  addressOrUsername={latestAddress ?? ''} /> <IconButton disabled={disabled} hideText src={showSelect ? <MinusOutlined /> : <SwapOutlined />} style={{ marginLeft: 4 }} text='Switch' onClick={() => setShowSelect(!showSelect)} />
        </div>
      }
      {showSelect && AddressInput}
    </div>
  </>
}