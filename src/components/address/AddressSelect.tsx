import { Dropdown, Input } from 'antd';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { SearchDropdown } from '../navigation/SearchDropdown';

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
  const [changed, setChanged] = useState<boolean>(false);
  const [input, setInput] = useState<string>(defaultValue ? defaultValue : '');

  return <>
    <br />
    <Input.Group compact className='flex'>
      <Dropdown
        open={changed && input != ''}
        placement="bottom"
        overlay={
          <SearchDropdown
            onlyAddresses
            searchValue={input}
            onSearch={async (value: string | BitBadgesUserInfo<bigint>) => {
              // const account = await accounts.fetchAccounts([addressOrUsername]);
              // console.log("FETCHED ACCOUNT", JSON.stringify(account));
              if (typeof value === "string") return

              onUserSelect(value.address);
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
            setChanged(true);
          }}
        />
      </Dropdown>
    </Input.Group>
  </>
}