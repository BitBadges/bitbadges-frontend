import { DeleteOutlined, SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { useState } from "react";
import { } from "../../constants";
import { AddressDisplayTitle } from "./AddressDisplay";
import { AddressDisplayList } from "./AddressDisplayList";
import { AddressSelect, EnterMethod } from "./AddressSelect";
import { BLANK_USER_INFO, convertToCosmosAddress, getChainForAddress } from "bitbadgesjs-utils";
import { getAccount, updateAccounts } from "../../bitbadges-api/contexts/accounts/AccountsContext";

export function AddressListSelect({
  users,
  setUsers,
  invalidUsers,
  hideAddresses,
  disabled,
  allowMintSearch
}: {
  users: string[],
  setUsers: (users: string[]) => void,
  invalidUsers?: { [user: string]: string; },
  hideAddresses?: boolean,
  disabled?: boolean,
  allowMintSearch?: boolean
}) {


  const [enterMethod, setEnterMethod] = useState(EnterMethod.Single);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchAddAddressListInput, setBatchAddAddressListInput] = useState<string>('');

  //For EnterMethod.Single, we use the AddressSelect component.

  //For EnterMethod.Batch, set the user list when the batch add is clicked.
  async function handleAddBatchUsers() {
    setLoading(true);
    const addressesList: string[] = batchAddAddressListInput.split('\n').filter((a) => a !== '').map(x => x.trim());


    //Manually generate blank accounts with the addresses if not already in context
    //We will check fetchedProfile later to see if we need to actually fetch from server
    const accountsToUpdate = [];
    for (const address of addressesList) {
      if (!getAccount(address)) {
        accountsToUpdate.push(
          {
            ...BLANK_USER_INFO,
            address: address,
            cosmosAddress: convertToCosmosAddress(address),
            chain: getChainForAddress(address),
          })
      }
    }

    if (accountsToUpdate.length > 0) {
      updateAccounts(accountsToUpdate)
    }

    setUsers([...users, ...addressesList]);
    setBatchAddAddressListInput('');
    setLoading(false);
  }

  return <>
    <br />
    {users.length > 0 && !hideAddresses && <div>
      <div className='flex-center'>
        <AddressDisplayList
          users={users}
          setUsers={setUsers}
          invalidUsers={invalidUsers}
          title="Added Addresses"
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
      icon={<><Tooltip title={<>
        {enterMethod === EnterMethod.Single && <>Batch Add</>}
        {enterMethod === EnterMethod.Batch && <>Manual Add</>}
      </>}>

        <SwapOutlined
          disabled={disabled}
          onClick={() => setEnterMethod(enterMethod == EnterMethod.Single ?
            EnterMethod.Batch : EnterMethod.Single
          )} style={{ cursor: 'pointer' }} />
      </Tooltip>
        <Tooltip title={<>Reset All</>}>
          <DeleteOutlined disabled={disabled} onClick={() => setUsers([])} style={{ cursor: 'pointer', marginLeft: 4 }} />
        </Tooltip>
      </>
      }
    />
    {
      enterMethod === EnterMethod.Single &&
      <AddressSelect
        onUserSelect={(userInfo) => {
          setUsers([...users, userInfo]);
        }}
        disabled={disabled}
        allowMintSearch={allowMintSearch}
        switchable={false}
      />
    }
    {
      enterMethod === EnterMethod.Batch &&
      <>
        <br />
        <TextArea
          className="primary-text inherit-bg"
          style={{ minHeight: 200 }}
          placeholder="Enter addresses here (one per line)"
          value={batchAddAddressListInput}
          disabled={disabled}
          onChange={(e) => setBatchAddAddressListInput(e.target.value)}
        />
        <br />
        <br />
        <Button
          type="primary"
          className="full-width"
          disabled={batchAddAddressListInput.length === 0 || disabled}
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