import { UserDeleteOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import { useEffect, useState } from "react"
import { getPageDetails } from "../../utils/pagination"
import { Pagination } from "../common/Pagination"
import { AddressDisplay } from "./AddressDisplay"
import { INFINITE_LOOP_MODE } from "../../constants"

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
  filterMint
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
  filterMint?: boolean
}) {
  const [currPage, setCurrPage] = useState<number>(1);

  //Indexes are not the same as badge IDs. Ex: If badgeIds = [1-10, 20-30] and pageSize = 20, then currPageStart = 0 and currPageEnd = 19
  const [currPageStart, setCurrPageStart] = useState<number>(0); // Index of first badge to display
  const [currPageEnd, setCurrPageEnd] = useState<number>(0); // Index of last badge to display

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: address display list');
    const currPageDetails = getPageDetails(currPage, pageSize, 0, users.length - 1);
    const currPageStart = currPageDetails.start;
    const currPageEnd = currPageDetails.end;

    setCurrPageStart(currPageStart);
    setCurrPageEnd(currPageEnd);
  }, [currPage, pageSize, users]);


  users = users.filter(x => x !== 'Total');

  // let allExceptMint = false;
  // if (users.length == 1 && users[0] == 'Mint' && allExcept) {
  //   allExceptMint = true;
  //   users = [];
  // }



  if (filterMint) users = users.filter(x => x !== 'Mint');

  if (allExcept) {
    //append it at beginning
    users.unshift('All');

    // if (!filterMint) {
    //   users.push('Mint');
    // }
  } else if (users.length == 0) {
    users.push('All');
  }

  // const str = title
  //   ? title
  //   : allExcept
  //     ? allExceptMint
  //       ? 'All'
  //       : users.length === 0
  //         ? !filterMint
  //           ? 'All + Mint'
  //           : 'All'
  //         : 'All Except'
  //     : users.length === 1
  //       ? ''
  //       : 'Addresses';

  return <div style={{ maxHeight: 500, overflow: 'auto', color: fontColor ?? 'white', fontSize: fontSize, alignItems: 'center' }}>
    {!hideTitle &&
      title ? <h3 style={{ color: fontColor ?? 'white' }}>{title}</h3> : <></>

      // <h3 style={{ color: fontColor ?? 'white' }}>{title ? title : allExcept ? allExceptMint ? 'All' : users.length == 0 ?
      //   !filterMint ? 'All + Mint' :
      //     'All' : 'All Except' : users.length == 1 ? <></> : 'Addresses'} </h3>
    }
    {/* {!(allExcept && users.length == 0) && !allExceptMint && (toLength ? toLength : users.length) > 1 && <>({toLength ? toLength : users.length})</>}</h3>} */}
    <Pagination total={users.length} pageSize={pageSize} onChange={(page) => setCurrPage(page)} currPage={currPage} />

    {users.map((user, index) => {
      if (index < currPageStart || index > currPageEnd) return null;

      const allowedMessage = invalidUsers ? invalidUsers[user] : undefined;

      return (
        <div key={index} className={center ? 'flex-center' : undefined} style={{ marginRight: 8, marginTop: 4 }}>
          <AddressDisplay
            icon={
              setUsers &&
              <Tooltip title={"Remove User"}>
                <UserDeleteOutlined onClick={() => {
                  setUsers(users.filter((_, i) => i !== index))
                }} />
              </Tooltip>
            }
            addressOrUsername={user}

            fontColor={((allowedMessage || allExcept) && (user != 'All'))
              || (!allExcept && user == 'All')

              ? 'red' : fontColor}
            fontSize={fontSize}
          />
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