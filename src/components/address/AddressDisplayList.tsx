import { CopyOutlined, InfoCircleOutlined, UserDeleteOutlined } from "@ant-design/icons"
import { Spin, Tooltip, notification } from "antd"
import { deepCopy } from "bitbadgesjs-proto"
import { useEffect, useState } from "react"
import { INFINITE_LOOP_MODE } from "../../constants"
import { getPageDetails } from "../../utils/pagination"
import { Pagination } from "../common/Pagination"
import { AddressDisplay } from "./AddressDisplay"

import { isAddressValid } from "bitbadgesjs-utils"
import { getAccounts } from "../../bitbadges-api/api"
import { fetchAccounts, getAccount, updateAccounts } from "../../bitbadges-api/contexts/accounts/AccountsContext"

export function AddressDisplayList({
  users,
  setUsers,
  invalidUsers,
  fontColor,
  fontSize,
  title,
  hideTitle,
  center = true,
  // toLength,
  pageSize = 10,
  allExcept,
  filterMint,
  trackerIdList,
  hideIcons,

}: {
  users: string[],
  setUsers?: (users: string[]) => void
  invalidUsers?: { [user: string]: string },
  fontColor?: string
  fontSize?: number,
  title?: string,
  hideTitle?: boolean
  center?: boolean,
  // toLength?: number
  pageSize?: number
  allExcept?: boolean,
  filterMint?: boolean,
  trackerIdList?: boolean,
  hideIcons?: boolean
}) {
  const [currPage, setCurrPage] = useState<number>(1);

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [currPageStart, setCurrPageStart] = useState<number>(0); // Index of first badge to display
  const [currPageEnd, setCurrPageEnd] = useState<number>(0); // Index of last badge to display
  const [copying, setCopying] = useState<boolean>(false);


  let usersToDisplay = deepCopy(users);
  usersToDisplay = usersToDisplay.filter(x => x !== 'Total');

  if (filterMint) usersToDisplay = usersToDisplay.filter(x => x !== 'Mint');

  if (allExcept) {
    //append it at beginning
    usersToDisplay = ['All', ...usersToDisplay];
  } else if (usersToDisplay.length == 0) {
    usersToDisplay = [];
  }

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: address display list');
    const currPageDetails = getPageDetails(currPage, pageSize, 0, usersToDisplay.length - 1);
    const currPageStart = currPageDetails.start;
    const currPageEnd = currPageDetails.end;

    setCurrPageStart(currPageStart);
    setCurrPageEnd(currPageEnd);

    const reservedNames = ['All', 'Mint'];
    if (!trackerIdList) fetchAccounts(usersToDisplay.slice(currPageStart, currPageEnd + 1).filter(x => !reservedNames.includes(x)));
  }, [currPage, pageSize, usersToDisplay, trackerIdList]);


  const calcNumFetch = () => {
    let numFetched = 0;
    for (const user of usersToDisplay) {
      if (user == 'All') continue;
      const account = getAccount(user);
      if (!account) continue;
      if (account.address) numFetched++;
    }

    return numFetched;
  }


  const copyAddresses = async () => {
    await getAllAddresses();
    let numFetched = calcNumFetch();
    while (numFetched < usersToDisplay.length) {
      await new Promise(r => setTimeout(r, 100));
      numFetched = calcNumFetch();
    }

    navigator.clipboard.writeText(usersToDisplay.map(x => getAccount(x)?.address).join('\n'));
  }


  const getAllAddresses = async () => {
    const addressesToFetch = usersToDisplay.filter(x => x != 'All');

    let next250ToFetch = [];
    for (let i = 0; i < addressesToFetch.length; i++) {
      if (!getAccount(usersToDisplay[i])?.address) {
        next250ToFetch.push(usersToDisplay[i]);

        if (next250ToFetch.length == 250 || i == usersToDisplay.length - 1) {
          const res = await getAccounts({
            accountsToFetch: next250ToFetch.map(x => {
              return {
                address: isAddressValid(x) ? x : undefined,
                username: isAddressValid(x) ? undefined : x
              }
            })
          });
          updateAccounts(res.accounts);
          next250ToFetch = [];
        }
      }
    }
  }

  return <div className="primary-text" style={{ maxHeight: 500, overflow: 'auto', color: fontColor, fontSize: fontSize, alignItems: 'center' }}>
    {!hideTitle &&
      title ? <h3 style={{ color: fontColor }}>{title}</h3> : <></>
    }
    <Pagination total={usersToDisplay.length} pageSize={pageSize} onChange={(page) => setCurrPage(page)} currPage={currPage} />
    {usersToDisplay.length == 0 && <div style={{ color: 'red' }}>None</div>}
    {usersToDisplay.map((user, index) => {
      if (index < currPageStart || index > currPageEnd) return null;

      const allowedMessage = invalidUsers ? invalidUsers[user] : undefined;

      return (
        <div key={index} className={center ? 'flex-center' : undefined} style={{ marginRight: 8, marginLeft: 8 }}>
          {trackerIdList ?
            <div style={{ color: (allowedMessage || allExcept) && (user != 'All') ? 'red' : fontColor }}>
              <Tooltip title={user}  >
                {user.length > 10 ?
                  `${user.substring(0, 10)}...` : user}
              </Tooltip>

            </div>
            : <AddressDisplay
              icon={
                !hideIcons && setUsers && user != 'All' &&
                <Tooltip title={"Remove User"}>
                  <UserDeleteOutlined onClick={() => {
                    setUsers(users.filter((x => x !== user)));
                  }} />
                </Tooltip>
              }
              addressOrUsername={user}

              fontColor={((allowedMessage || allExcept) && (user != 'All'))
                || (!allExcept && user == 'All')

                ? 'red' : fontColor}
              fontSize={fontSize}
            />}
          {allowedMessage && allowedMessage.length > 0 &&
            <div style={{ color: 'red' }}>
              Reason: {allowedMessage}
            </div>
          }
        </div>
      )
    })}


    {usersToDisplay.filter(x => x != 'All').length > 1 && !trackerIdList && <div className='flex-center flex-column'>
      <br />

      <a

        onClick={async () => {
          if (copying) {
            notification.info({
              message: 'Already Copying!',
              description: 'The addresses are currently being copied to your clipboard.',
            });
            return
          }
          setCopying(true);
          await copyAddresses();
          setCopying(false);

          notification.success({
            message: 'Addresses Copied!',
            description: 'The addresses have been copied to your clipboard.',
          });
        }}
      >
        Copy All Addresses <CopyOutlined />
      </a>

      {copying && <>
        <br /><br />
        <InfoCircleOutlined style={{ marginRight: 4 }} /> We first need to fetch the details for each user in the list (if not already fetched). This may take some time.
        <br /><br />
        <div className="flex-center">
          <Spin size="large" />
        </div>
        <br /><br />
      </>}
    </div>}
  </div>
}