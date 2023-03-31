import { SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip, Typography } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { AddressDisplayList, AddressDisplayTitle } from "./AddressDisplay";
import { AddressSelect, EnterMethod } from "./AddressSelect";
import { BitBadgesUserInfo, SupportedChain, getChainForAddress } from "bitbadges-sdk";
import { PRIMARY_TEXT, PRIMARY_BLUE } from "../../constants";

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
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        chain: SupportedChain.UNKNOWN,
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
    } as BitBadgesUserInfo);
    const [batchAddAddressList, setBatchAddAddressList] = useState<string>('');

    //For EnterMethod.Single, set the user lift when the currUserInfo changes.
    useEffect(() => {
        if (!currUserInfo?.address || !currUserInfo?.chain || !currUserInfo?.cosmosAddress) {
            return;
        };
        setUsers([
            ...users,
            {
                cosmosAddress: currUserInfo?.cosmosAddress,
                accountNumber: currUserInfo?.accountNumber,
                chain: currUserInfo?.chain,
                address: currUserInfo?.address,
                name: currUserInfo?.name
            }
        ]);
        setCurrUserInfo({
            chain: currUserInfo?.chain,
            address: '',
            cosmosAddress: '',
            accountNumber: -1
        } as BitBadgesUserInfo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currUserInfo]);

    //For EnterMethod.Batch, set the user list when the batch add is clicked.
    async function updateBatchUsers() {
        const batchUsersList = batchAddAddressList.split('\n').filter((a) => a !== '').map(x => x.trim());
        const fetchedAccounts = await accounts.fetchAccounts(batchUsersList.filter(address => {
            return !users.find((u) => u.address === address || u.name === address);
        }));

        let newUserList = [...users];
        for (const address of batchUsersList) {

            const existingUser = users.find((u) => u.address === address || u.cosmosAddress === address || u.name === address);

            //Check if already in user list. If so, we duplicate it.
            //If not, search for it in the fetched accounts.
            if (existingUser) {
                newUserList.push(existingUser);
            } else {
                const userInfo = fetchedAccounts.find((u) => u.address === address || u.cosmosAddress === address || u.name === address);
                if (userInfo) {
                    newUserList.push(userInfo);
                } else {
                    newUserList.push({
                        accountNumber: -1,
                        address: address,
                        chain: getChainForAddress(address),
                        cosmosAddress: '',
                    });
                }
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
                currUserInfo={currUserInfo}
                setCurrUserInfo={setCurrUserInfo}
                fontColor={PRIMARY_TEXT}
                darkMode={darkMode}
                hideAddressDisplay
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
                        setBatchAddAddressList('');
                        setLoading(false);
                    }}>
                    <UserAddOutlined /> Add Users
                </Button>
            </>
        }
    </>

}