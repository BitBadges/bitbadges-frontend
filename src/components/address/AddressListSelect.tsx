import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { AddressDisplayList, AddressDisplayTitle } from "./AddressDisplay";
import { AddressSelect, EnterMethod } from "./AddressSelect";
import TextArea from "antd/lib/input/TextArea";
import { getAccountInformation } from "../../bitbadges-api/api";

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

    const [batchAddAddressList, setBatchAddAddressList] = useState<string>('');

    useEffect(() => {
        console.log("updating");
        async function updateUsers() {
            const currBatchUserList = batchAddAddressList.split('\n');
            if (currBatchUserList.length === 1 && currBatchUserList[0] === '') {
                return;
            }

            let newUsers = [];
            for (const address of currBatchUserList) {
                if (users.find((u) => u.address === address)) {
                    newUsers.push(users.find((u) => u.address === address));
                } else {
                    let accountInfo = await getAccountInformation(address);
                    newUsers.push(accountInfo);
                }
            }
            console.log(newUsers);

            setUsers(newUsers);
        }
        updateUsers();
    }, [batchAddAddressList, users, setUsers]);



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
                icon={
                    <UserAddOutlined />
                }
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
                value={batchAddAddressList}
                onChange={(e) => setBatchAddAddressList(e.target.value)}
            //TODO:
            />
            <p>TODO</p>
            <p>*Only one address per line</p>
            <br />
            <Button
                type="primary"
                style={{ width: "100%" }}
                disabled={!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress}
                onClick={() => {
                    //TODO:
                    // if (!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress) {
                    //     return;
                    // };
                    // setUsers([
                    //     ...users,
                    //     {
                    //         cosmosAddress: currUserInfo?.cosmosAddress,
                    //         accountNumber: currUserInfo?.accountNumber,
                    //         chain: currUserInfo?.chain,
                    //         address: currUserInfo?.address
                    //     }
                    // ]);
                    // setCurrUserInfo({
                    //     chain: currUserInfo?.chain,
                    //     address: '',
                    //     cosmosAddress: '',
                    //     accountNumber: -1,
                    // } as BitBadgesUserInfo);
                }}>
                <UserAddOutlined /> Add Users
            </Button>
        </>}


    </>

}