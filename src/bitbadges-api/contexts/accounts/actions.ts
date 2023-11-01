import { BitBadgesUserInfo, DesiredNumberType } from "bitbadgesjs-utils";

export const updateAccountsRedux = (userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false) => ({
  type: 'UPDATE_ACCOUNTS',
  payload: {
    userInfos,
    forcefulRefresh
  }
});
