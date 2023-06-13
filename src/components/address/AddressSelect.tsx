import { Dropdown, Input } from 'antd';
import { useState } from 'react';
import { SearchDropdown } from '../navigation/SearchDropdown';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';

export enum EnterMethod {
  Single = 'Single',
  Batch = 'Batch',
}

export function AddressSelect({
  defaultValue,
  onUserSelect,
}: {
  defaultValue?: string,
  onUserSelect: (currUserInfo: string) => void,
}) {
  const [input, setInput] = useState<string>(defaultValue ? defaultValue : '');
  const accounts = useAccountsContext();

  return <>
    <br />
    <Input.Group compact className='flex'>
      <Dropdown
        open={input !== ''}
        placement="bottom"
        overlay={
          <SearchDropdown
            onlyAddresses
            searchValue={input}
            onSearch={async (addressOrUsername: string) => {
              const account = await accounts.fetchAccounts([addressOrUsername]);
              onUserSelect(account[0].cosmosAddress);
              setInput('');
            }}
          />
        }
        trigger={['hover', 'click']}
      >
        <Input
          value={input}
          className='primary-text primary-blue-bg'
          onChange={async (e) => {
            e.preventDefault();
            setInput(e.target.value);
          }}
        />
      </Dropdown>
    </Input.Group>
  </>
}