import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { useState } from "react";
import { useAccountsContext } from "../../accounts/AccountsContext";
import { isAddressValid } from "../../bitbadges-api/chains";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
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
    disallowedUsers?: BitBadgesUserInfo[],
    darkMode?: boolean
}) {
    const accounts = useAccountsContext();

    const [enterMethod, setEnterMethod] = useState(EnterMethod.Single);
    const [loading, setLoading] = useState<boolean>(false);
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        chain: SupportedChain.UNKNOWN,
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
    } as BitBadgesUserInfo);
    const [batchAddAddressList, setBatchAddAddressList] = useState<string>('');

    async function updateUsers() {
        const batchUsersList = batchAddAddressList.split('\n').filter((a) => a !== '');

        const fetchedAccounts = await accounts.fetchAccounts(batchUsersList.filter(address => {
            return isAddressValid(address) && !users.find((u) => u.address === address);
        }));

        let newUserList = users;
        for (const address of batchUsersList) {
            if (isAddressValid(address)) {
                const existingUser = users.find((u) => u.address === address);

                //TODO: Batch get addresses instead of N HTTP requests
                //Check if already in user list. If so, we duplicate it.
                if (existingUser) {
                    newUserList.push(existingUser);
                } else {
                    const userInfo = fetchedAccounts.find((u) => u.address === address || u.cosmosAddress === address);
                    if (userInfo) newUserList.push(userInfo);
                }
            } else {
                newUserList.push({
                    accountNumber: -1,
                    address: address,
                    chain: SupportedChain.UNKNOWN,
                    cosmosAddress: '',
                });
            }
        }

        setUsers(newUserList);
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
            {disallowedUsers && disallowedUsers?.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><br />
                <Typography.Text type="danger">
                    You are not approved to transfer to some of the selected recipients. Please remove these recipients.
                </Typography.Text>
            </div>}

            <Divider />
        </div>}

        <AddressDisplayTitle
            title={"Add Recipients"}
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
        {enterMethod === EnterMethod.Single && <>
            <AddressSelect
                currUserInfo={currUserInfo}
                setCurrUserInfo={setCurrUserInfo}
                fontColor={PRIMARY_TEXT}
                darkMode={darkMode}
            />
            <br />
            <Button
                type="primary"
                style={{ width: "100%" }}
                disabled={!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress}
                onClick={() => {
                    if (!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress) {
                        return;
                    };
                    setUsers([
                        ...users,
                        {
                            cosmosAddress: currUserInfo?.cosmosAddress,
                            accountNumber: currUserInfo?.accountNumber,
                            chain: currUserInfo?.chain,
                            address: currUserInfo?.address
                        }
                    ]);
                    setCurrUserInfo({
                        chain: currUserInfo?.chain,
                        address: '',
                        cosmosAddress: '',
                        accountNumber: -1,
                    } as BitBadgesUserInfo);
                }}>
                <UserAddOutlined /> Add New User
            </Button>
        </>
        }
        {enterMethod === EnterMethod.Batch && <>
            <br />
            <TextArea
                style={{ minHeight: 200, backgroundColor: darkMode ? PRIMARY_BLUE : undefined, color: darkMode ? PRIMARY_TEXT : undefined }}
                value={batchAddAddressList}
                onChange={(e) => setBatchAddAddressList(e.target.value)}
            />
            <p style={{ textAlign: 'left' }}>*Enter one address per line</p>
            <br />
            <Button
                type="primary"
                style={{ width: "100%" }}
                disabled={batchAddAddressList.length === 0}
                loading={loading}
                onClick={async () => {
                    setLoading(true);
                    await updateUsers();
                    setBatchAddAddressList('');
                    setLoading(false);
                }}>
                <UserAddOutlined /> Add Users
            </Button>
        </>}


    </>

}