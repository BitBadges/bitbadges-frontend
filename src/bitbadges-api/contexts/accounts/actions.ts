import { BitBadgesUserInfo } from "bitbadgesjs-utils";
import { DesiredNumberType } from "../../api";

export const updateAccountsRedux = (userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false) => ({
  type: 'UPDATE_ACCOUNTS',
  payload: {
    userInfos,
    forcefulRefresh
  }
});
