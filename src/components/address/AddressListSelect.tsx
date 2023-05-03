import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { BitBadgesUserInfo } from "bitbadgesjs-utils";
import { useState } from "react";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { AddressDisplayList, AddressDisplayTitle } from "./AddressDisplay";
import { AddressSelect, EnterMethod } from "./AddressSelect";

export function AddressListSelect({
  users,
  setUsers,
  disallowedUsers,
  darkMode
}: {
  users: BitBadgesUserInfo[],
  setUsers: (users: BitBadgesUserInfo[]) => void,
  disallowedUsers?: { [cosmosAddress: string]: string; },
  darkMode?: boolean
}) {
  const accounts = useAccountsContext();

  const [enterMethod, setEnterMethod] = useState(EnterMethod.Single);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchAddAddressList, setBatchAddAddressList] = useState<string>('');

  //For EnterMethod.Single, we use the AddressSelect component.

  //For EnterMethod.Batch, set the user list when the batch add is clicked.
  async function updateBatchUsers() {
    const addressesList: string[] = batchAddAddressList.split('\n').filter((a) => a !== '').map(x => x.trim());

    const fetchedAccounts = await accounts.fetchAccounts(addressesList);
    //TODO: Handle batch add by name and username
    // Also error handling
    setUsers([...users, ...fetchedAccounts]);
    setBatchAddAddressList('');
  }

  return <>
    <br />
    {users.length > 0 && <div>
      <AddressDisplayList
        users={users}
        setUsers={setUsers}
        disallowedUsers={disallowedUsers}
        fontColor={darkMode ? PRIMARY_TEXT : 'black'}
      />
      {disallowedUsers && Object.values(disallowedUsers)?.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><br />
        <Typography.Text type="danger">
          You are not approved to transfer to some of the selected recipients. Please remove these recipients.
        </Typography.Text>
      </div>}
      <Divider />
    </div>}

    <AddressDisplayTitle
      title={"Add Addresses"}
      icon={<Tooltip title={<>
        {enterMethod === EnterMethod.Single && <>Batch Add</>}
        {enterMethod === EnterMethod.Batch && <>Manual Add</>}
      </>}>
        <SwapOutlined onClick={() => setEnterMethod(enterMethod == EnterMethod.Single ?
          EnterMethod.Batch : EnterMethod.Single
        )} style={{ cursor: 'pointer' }} />
      </Tooltip>
      }
    />
    {enterMethod === EnterMethod.Single &&
      <AddressSelect
        onUserSelect={(userInfo) => {
          setUsers([
            ...users, userInfo
          ]);
        }}
        fontColor={PRIMARY_TEXT}
        darkMode={darkMode}
      />
    }
    {enterMethod === EnterMethod.Batch &&
      <>
        <br />
        <TextArea
          style={{ minHeight: 200, backgroundColor: darkMode ? PRIMARY_BLUE : undefined, color: darkMode ? PRIMARY_TEXT : undefined }}
          value={batchAddAddressList}
          onChange={(e) => setBatchAddAddressList(e.target.value)}
        />
        <p style={{ textAlign: 'left' }}>Enter one address per line</p>
        <br />
        <Button
          type="primary"
          style={{ width: "100%" }}
          disabled={batchAddAddressList.length === 0}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await updateBatchUsers();
            setLoading(false);
          }}>
          <UserAddOutlined /> Add Users
        </Button>
      </>
    }
  </>

}