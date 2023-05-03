import { Dropdown, Input } from 'antd';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { useAccountsContext } from '../../contexts/AccountsContext';
import { SearchDropdown } from '../navigation/SearchDropdown';

export enum EnterMethod {
  Single = 'Single',
  Batch = 'Batch',
}

export function AddressSelect({
  defaultValue,
  onUserSelect,
  darkMode
}: {
  defaultValue?: string,
  onUserSelect: (currUserInfo: BitBadgesUserInfo) => void,
  fontColor?: string,
  darkMode?: boolean,
}) {
  const accounts = useAccountsContext();

  const [input, setInput] = useState<string>(defaultValue ? defaultValue : '');

  return <>
    <br />
    <Input.Group compact style={{ display: 'flex' }}>
      <Dropdown
        open={input !== ''}
        placement="bottom"
        overlay={
          <SearchDropdown
            onlyAddresses
            searchValue={input}
            onSearch={(searchValue: string) => {
              onUserSelect(accounts.accounts[accounts.cosmosAddresses[searchValue]]);
              setInput('');
            }}
          />
        }
        trigger={['hover', 'click']}
      >
        <Input
          value={input}
          style={darkMode ? {
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT
          } : undefined}
          onChange={async (e) => {
            e.preventDefault();
            setInput(e.target.value);
          }}
        />
      </Dropdown>
    </Input.Group>
  </>
}