import { BitBadgesUserInfo } from "bitbadgesjs-utils";
import { AddressListSelect } from "../../address/AddressListSelect";
import { PRIMARY_TEXT } from "../../../constants";

export function UserListSelectStepItem(
    userList: BitBadgesUserInfo[],
    setUserList: (userList: BitBadgesUserInfo[]) => void,
) {

    return {
      title: 'Select Users',
      description: `Select the users that own this badge.`,
      node: <div style={{ color: PRIMARY_TEXT, display: 'flex', justifyContent: 'center'}}>
        <div style={{width: '100%'}}>
            <AddressListSelect
              darkMode
              users={userList}
              setUsers={setUserList}
            />
        </div>
      </div>,
      disabled: userList.length === 0
  }
}