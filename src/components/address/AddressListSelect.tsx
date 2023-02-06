import { useState } from "react";
import { BitBadgesUserInfo, SupportedChain } from "../../bitbadges-api/types";
import { AddressSelect } from "./AddressSelect";
import { Button, Divider, Typography } from "antd";
import { AddressDisplayList } from "./AddressDisplay";
import { UserAddOutlined } from "@ant-design/icons";

export function AddressListSelect({
    users,
    setUsers,
}
    :
    {
        users: BitBadgesUserInfo[],
        setUsers: (users: BitBadgesUserInfo[]) => void,
    }
) {
    const [showUserList, setShowUserList] = useState<boolean>(true);

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
            <div className='flex-between'>
                <Typography.Text style={{ fontSize: 18 }}>
                    {users.length} recipients added
                </Typography.Text>
                <Button
                    onClick={() => setShowUserList(!showUserList)}
                    disabled={users.length === 0}
                >
                    {showUserList ? 'Hide' : 'Show'} Recipient List
                </Button>
            </div>





            {showUserList && <><br /><AddressDisplayList
                users={users}
                setUsers={setUsers}
            /></>}
            {/* <hr /> */}
            <Divider />
        </>
        }


        <AddressSelect currUserInfo={currUserInfo} setCurrUserInfo={setCurrUserInfo} title={"Add User?"} icon={<UserAddOutlined />} />
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