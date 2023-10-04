import { BitBadgesUserInfo, DesiredNumberType } from "bitbadgesjs-utils";

export const updateAccountsRedux = (userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false, cookies: { [key: string]: string } = {}) => ({
  type: 'UPDATE_ACCOUNTS',
  payload: {
    userInfos,
    forcefulRefresh,
    cookies
  }
});
