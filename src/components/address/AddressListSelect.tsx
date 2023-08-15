import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { } from "../../constants";
import { AddressDisplayTitle } from "./AddressDisplay";
import { AddressDisplayList } from "./AddressDisplayList";
import { AddressSelect, EnterMethod } from "./AddressSelect";

export function AddressListSelect({
  users,
  setUsers,
  invalidUsers
}: {
  users: string[],
  setUsers: (users: string[]) => void,
  invalidUsers?: { [user: string]: string; }
}) {
  const accounts = useAccountsContext();

  const [enterMethod, setEnterMethod] = useState(EnterMethod.Single);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchAddAddressListInput, setBatchAddAddressListInput] = useState<string>('');

  //For EnterMethod.Single, we use the AddressSelect component.

  //For EnterMethod.Batch, set the user list when the batch add is clicked.
  async function handleAddBatchUsers() {
    const addressesList: string[] = batchAddAddressListInput.split('\n').filter((a) => a !== '').map(x => x.trim());


    //TODO: Should we even fetch the accounts here? We can just manually generate the accounts / convert to cosmosAddresses/
    const accountsFetched = await accounts.fetchAccountsWithOptions(addressesList.map(x => {
      return {
        address: x,
        noExternalCalls: true
      }
    }));
    setUsers([...users, ...accountsFetched.map(x => x.cosmosAddress)]);
    setBatchAddAddressListInput('');
  }

  return <>
    <br />
    {users.length > 0 && <div>
      <div className='flex-center'>
        <AddressDisplayList
          users={users}
          setUsers={setUsers}
          invalidUsers={invalidUsers}
        />
      </div>

      {invalidUsers && Object.values(invalidUsers)?.length > 0 && <div className='flex-center'><br />
        <Typography.Text type="danger">
          You are not approved to transfer to some of the selected recipients. Please remove these recipients.
        </Typography.Text>
      </div>}
      <Divider />
    </div >}

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
    {
      enterMethod === EnterMethod.Single &&
      <AddressSelect
        onUserSelect={(userInfo) => {
          setUsers([...users, userInfo]);
        }}
      />
    }
    {
      enterMethod === EnterMethod.Batch &&
      <>
        <br />
        <TextArea
          className="primary-text primary-blue-bg"
          style={{ minHeight: 200 }}
          placeholder="Enter addresses here (one per line)"
          value={batchAddAddressListInput}
          onChange={(e) => setBatchAddAddressListInput(e.target.value)}
        />
        <br />
        <br />
        <Button
          type="primary"
          className="full-width"
          disabled={batchAddAddressListInput.length === 0}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await handleAddBatchUsers();
            setLoading(false);
          }}>
          <UserAddOutlined /> Add Users
        </Button>
      </>
    }
  </>

}