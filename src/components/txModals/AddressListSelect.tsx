import { useState } from "react";
import { BitBadgesUserInfo } from "../../bitbadges-api/types";
import { AddressSelect } from "./AddressSelect";
import { Button } from "antd";
import { AddressModalDisplayList } from "./AddressModalDisplay";
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
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }

    return <>
        <AddressModalDisplayList
            users={users}
            setUsers={setUsers}
        />

        <AddressSelect onChange={handleChange} title={"Add User?"} icon={<UserAddOutlined />} />
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
                setCurrUserInfo(undefined);
            }}>
            <UserAddOutlined></UserAddOutlined> Add New User
        </Button>
    </>
}