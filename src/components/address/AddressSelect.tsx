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
  disabled,
}: {
  defaultValue?: string,
  onUserSelect: (currUserInfo: string) => void,
  disabled?: boolean,
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
          className='primary-text inherit-bg'
          onChange={async (e) => {
            e.preventDefault();
            setInput(e.target.value);
            setChanged(true);
          }}
          disabled={disabled}
        />
      </Dropdown>
    </Input.Group>
  </>
}