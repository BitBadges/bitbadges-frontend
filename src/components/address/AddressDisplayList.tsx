import { UserDeleteOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import { useEffect, useState } from "react"
import { getPageDetails } from "../../utils/pagination"
import { Pagination } from "../common/Pagination"
import { AddressDisplay } from "./AddressDisplay"
import { INFINITE_LOOP_MODE } from "../../constants"
import { deepCopy } from "bitbadgesjs-proto"
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext"
import { getAbbreviatedAddress } from "bitbadgesjs-utils"

export function AddressDisplayList({
  users,
  setUsers,
  invalidUsers,
  fontColor,
  fontSize,
  title,
  hideTitle,
  center,
  // toLength,
  pageSize = 10,
  allExcept,
  filterMint,
  trackerIdList,
  hideIcons
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
  const accounts = useAccountsContext();
  let usersToDisplay = deepCopy(users);
  usersToDisplay = usersToDisplay.filter(x => x !== 'Total');

  if (filterMint) usersToDisplay = usersToDisplay.filter(x => x !== 'Mint');

  if (allExcept) {
    //append it at beginning
    usersToDisplay = ['All', ...usersToDisplay];
  } else if (usersToDisplay.length == 0) {
    usersToDisplay = ['All'];
  }

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: address display list');
    const currPageDetails = getPageDetails(currPage, pageSize, 0, usersToDisplay.length - 1);
    const currPageStart = currPageDetails.start;
    const currPageEnd = currPageDetails.end;

    setCurrPageStart(currPageStart);
    setCurrPageEnd(currPageEnd);

    const reservedNames = ['All', 'Mint'];
    if (!trackerIdList) accounts.fetchAccounts(usersToDisplay.slice(currPageStart, currPageEnd + 1).filter(x => !reservedNames.includes(x)));
  }, [currPage, pageSize, usersToDisplay]);



  return <div style={{ maxHeight: 500, overflow: 'auto', color: fontColor ?? 'white', fontSize: fontSize, alignItems: 'center' }}>
    {!hideTitle &&
      title ? <h3 style={{ color: fontColor ?? 'white' }}>{title}</h3> : <></>
    }
    <Pagination total={usersToDisplay.length} pageSize={pageSize} onChange={(page) => setCurrPage(page)} currPage={currPage} />

    {usersToDisplay.map((user, index) => {
      if (index < currPageStart || index > currPageEnd) return null;

      const allowedMessage = invalidUsers ? invalidUsers[user] : undefined;

      return (
        <div key={index} className={center ? 'flex-center' : undefined} style={{ marginRight: 8, marginLeft: 8 }}>
          {trackerIdList ? <div style={{ color: (allowedMessage || allExcept) && (user != 'All') ? 'red' : fontColor }}>

            {getAbbreviatedAddress(user)} </div> : <AddressDisplay
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
  </div>
}