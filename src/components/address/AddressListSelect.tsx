import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { AddressDisplayList, AddressDisplayTitle } from "./AddressDisplay";
import { AddressSelect, EnterMethod } from "./AddressSelect";
import TextArea from "antd/lib/input/TextArea";
import { getAccountInformation } from "../../bitbadges-api/api";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { convertToCosmosAddress } from "../../bitbadges-api/chains";

export function AddressListSelect({
    users,
    setUsers,
    disallowedUsers,
    darkMode
}
    :
    {
        users: BitBadgesUserInfo[],
        setUsers: (users: BitBadgesUserInfo[]) => void,
        disallowedUsers?: BitBadgesUserInfo[],
        darkMode?: boolean
    }
) {
    const [showUserList, setShowUserList] = useState<boolean>(true);
    const [enterMethod, setEnterMethod] = useState(EnterMethod.Manual);
    const [loading, setLoading] = useState<boolean>(false);

    const [batchAddAddressList, setBatchAddAddressList] = useState<string>('');

    async function updateUsers() {
        const currBatchUserList = batchAddAddressList.split('\n');
        if (currBatchUserList.length === 1 && currBatchUserList[0] === '') {
            return;
        }

        let newUsers = users;
        for (const address of currBatchUserList) {
            const existingUser = users.find((u) => u.address === address);
            if (existingUser) {
                newUsers.push(existingUser);
            } else {
                let accountInfo = await getAccountInformation(convertToCosmosAddress(address));
                newUsers.push({
                    ...accountInfo,
                    accountNumber: accountInfo.account_number,
                });
            }
        }
        console.log(newUsers);

        setUsers(newUsers);
    }



    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        chain: SupportedChain.ETH,
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
    } as BitBadgesUserInfo);

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }


    return <>
        {users.length > 0 && <>
            {/* <div className='flex-between'>
                <Typography.Text style={{ fontSize: 18 }}>
                    {users.length} recipient{users.length > 1 ? 's' : ''} added
                </Typography.Text>
                <Button
                    onClick={() => setShowUserList(!showUserList)}
                    disabled={users.length === 0}
                >
                    {showUserList ? 'Hide' : 'Show'} Recipient List
                </Button>
            </div> */}






            {showUserList && <><br />
                <AddressDisplayList
                    users={users}
                    setUsers={setUsers}
                    disallowedUsers={disallowedUsers}
                    fontColor={PRIMARY_TEXT}

                />
                {disallowedUsers && disallowedUsers?.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><br />
                    <Typography.Text type="danger">
                        You are not approved to transfer to some of the selected recipients. Please remove these recipients.
                    </Typography.Text>
                </div>}
            </>
            }


            <Divider />
        </>}

        <AddressDisplayTitle
            accountNumber={currUserInfo.accountNumber ? currUserInfo.accountNumber : -1}
            title={"Add Recipient"} icon={<Tooltip title={<>
                {enterMethod === EnterMethod.Manual && <>Batch Add</>}
                {enterMethod === EnterMethod.Upload && <>Manual Add</>}
            </>}>
                <SwapOutlined onClick={() => setEnterMethod(enterMethod == EnterMethod.Manual ?
                    EnterMethod.Upload : EnterMethod.Manual
                )} style={{ cursor: 'pointer' }} />
            </Tooltip>
            }
            enterMethod={enterMethod}
            setEnterMethod={setEnterMethod}
        />
        {enterMethod === EnterMethod.Manual && <>
            <AddressSelect
                enterMethod={enterMethod}
                setEnterMethod={setEnterMethod}
                currUserInfo={currUserInfo}
                setCurrUserInfo={setCurrUserInfo}
                title={"Add Recipient"}
                fontColor={PRIMARY_TEXT}
                icon={
                    <UserAddOutlined />
                }
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
        {enterMethod === EnterMethod.Upload && <>
            <br />
            <TextArea
                style={{ minHeight: 200, backgroundColor: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                value={batchAddAddressList}
                onChange={(e) => setBatchAddAddressList(e.target.value)}
            //TODO:
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