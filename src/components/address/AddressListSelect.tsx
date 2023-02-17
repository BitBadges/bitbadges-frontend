import { UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Typography } from "antd";
import { useState } from "react";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { AddressDisplayList, AddressDisplayTitle } from "./AddressDisplay";
import { AddressSelect, EnterMethod } from "./AddressSelect";

export function AddressListSelect({
    users,
    setUsers,
    disallowedUsers,
}
    :
    {
        users: BitBadgesUserInfo[],
        setUsers: (users: BitBadgesUserInfo[]) => void,
        disallowedUsers?: BitBadgesUserInfo[],
    }
) {
    const [showUserList, setShowUserList] = useState<boolean>(true);
    const [enterMethod, setEnterMethod] = useState(EnterMethod.Manual);

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
            title={"Add Recipient"} icon={<UserAddOutlined />}
            enterMethod={enterMethod}
            setEnterMethod={setEnterMethod}
        />
        {enterMethod === EnterMethod.Manual && <>
            <AddressSelect
                enterMethod={enterMethod}
                setEnterMethod={setEnterMethod}
                currUserInfo={currUserInfo}
                setCurrUserInfo={setCurrUserInfo}
                title={"Add Recipient"} icon={<UserAddOutlined />}
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
        </>}
        {/* {enterMethod === EnterMethod.Upload && <>
            <b>TODO</b>
            //TODO: Upload CSV / Batch addresses
        </>} */}


    </>

}