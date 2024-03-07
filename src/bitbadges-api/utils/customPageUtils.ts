import { BitBadgesUserInfo, deepCopyPrimitives, CustomListPage, CustomPage, BatchBadgeDetails, BatchBadgeDetailsArray } from 'bitbadgesjs-sdk';
import { updateProfileInfo } from '../contexts/accounts/AccountsContext';

export const deleteCustomPage = async <T extends 'lists' | 'badges', U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  title: string,
  type: T,
  pageType: U
) => {
  const newCustomPages = deepCopyPrimitives(accountInfo[pageType]?.[type] ?? []) as T extends 'lists' ? CustomListPage[] : CustomPage<bigint>[];
  newCustomPages.splice(
    newCustomPages.findIndex((x) => x.title === title),
    1
  );

  await updateProfileInfo(accountInfo.address, {
    [pageType]: {
      lists: (type === 'lists' ? newCustomPages : accountInfo[pageType]?.lists ?? []) as CustomListPage[],
      badges: (type === 'badges' ? newCustomPages : accountInfo[pageType]?.badges ?? []) as CustomPage<bigint>[]
    }
  });
};

export const addNewCustomPage = async <T extends 'lists' | 'badges', U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  title: string,
  description: string,
  type: T,
  pageType: U
) => {
  const newCustomPages = deepCopyPrimitives(accountInfo[pageType]?.[type] ?? []) as T extends 'lists' ? CustomListPage[] : CustomPage<bigint>[];

  await updateProfileInfo(accountInfo.address, {
    [pageType]: {
      lists: (type === 'lists'
        ? [...newCustomPages, new CustomListPage({ title, description, items: [] })]
        : accountInfo[pageType]?.lists ?? []) as CustomListPage[],
      badges: (type === 'badges'
        ? [...newCustomPages, new CustomPage<bigint>({ title, description, items: [] })]
        : accountInfo[pageType]?.badges ?? []) as CustomPage<bigint>[]
    }
  });
};

export const removeBadgeFromPage = async <U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  selectedBadge: BatchBadgeDetails<bigint>,
  page: string,
  pageType: U
) => {
  const currCustomPageItems =
    (page === 'Hidden' ? accountInfo.clone().hiddenBadges : accountInfo.clone()[pageType]?.badges?.find((x) => x.title === page)?.items) ?? [];

  const currCustomPageBadges = BatchBadgeDetailsArray.From(currCustomPageItems);
  currCustomPageBadges.remove(selectedBadge);

  if (page === 'Hidden') {
    await updateProfileInfo(accountInfo.address, {
      hiddenBadges: currCustomPageBadges
    });
  } else {
    const currCustomPage = accountInfo[pageType]?.badges?.find((x) => x.title === page);
    if (!currCustomPage) return;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists: accountInfo[pageType]?.lists ?? [],
        badges:
          accountInfo[pageType]?.badges?.map((x) =>
            x.title === page
              ? {
                  ...currCustomPage,
                  items: currCustomPageBadges
                }
              : x
          ) ?? []
      }
    });
  }
};

export const addBadgeToPage = async <U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  selectedBadge: BatchBadgeDetails<bigint>,
  page: string,
  pageType: U
) => {
  const currCustomPageItems =
    (page === 'Hidden' ? accountInfo.clone().hiddenBadges : accountInfo.clone()[pageType]?.badges?.find((x) => x.title === page)?.items) ?? [];

  const currCustomPageBadges = BatchBadgeDetailsArray.From(currCustomPageItems);
  currCustomPageBadges.add(selectedBadge);

  if (page === 'Hidden') {
    await updateProfileInfo(accountInfo.address, {
      hiddenBadges: currCustomPageBadges
    });
  } else {
    const currCustomPage = accountInfo[pageType]?.badges?.find((x) => x.title === page);
    if (!currCustomPage) return;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists: accountInfo[pageType]?.lists ?? [],
        badges:
          accountInfo[pageType]?.badges?.map((x) =>
            x.title === page
              ? {
                  ...currCustomPage,
                  items: currCustomPageBadges
                }
              : x
          ) ?? []
      }
    });
  }
};

export const removeListFromPage = async <U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  selectedListId: string,
  page: string,
  pageType: U
) => {
  const currCustomPageLists =
    (page === 'Hidden' ? accountInfo.clone().hiddenLists : accountInfo.clone()[pageType]?.lists?.find((x) => x.title === page)?.items) ?? [];

  const newCustomPageLists = currCustomPageLists.filter((x) => x !== selectedListId);
  if (page === 'Hidden') {
    await updateProfileInfo(accountInfo.address, {
      hiddenLists: newCustomPageLists
    });
  } else {
    const currCustomPage = accountInfo[pageType]?.lists?.find((x) => x.title === page);
    if (!currCustomPage) return;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists:
          accountInfo[pageType]?.lists?.map((x) =>
            x.title === page
              ? {
                  ...currCustomPage,
                  items: newCustomPageLists
                }
              : x
          ) ?? [],
        badges: accountInfo[pageType]?.badges ?? []
      }
    });
  }
};

export const addListToPage = async <U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  selectedListId: string,
  page: string,
  pageType: U
) => {
  const currCustomPageLists =
    (page === 'Hidden' ? accountInfo.clone().hiddenLists : accountInfo.clone()[pageType]?.lists?.find((x) => x.title === page)?.items) ?? [];

  const newCustomPageLists = [...currCustomPageLists, selectedListId];
  if (page === 'Hidden') {
    await updateProfileInfo(accountInfo.address, {
      hiddenLists: newCustomPageLists
    });
  } else {
    const currCustomPage = accountInfo[pageType]?.lists?.find((x) => x.title === page);
    if (!currCustomPage) return;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists:
          accountInfo[pageType]?.lists?.map((x) =>
            x.title === page
              ? {
                  ...currCustomPage,
                  items: newCustomPageLists
                }
              : x
          ) ?? [],
        badges: accountInfo[pageType]?.badges ?? []
      }
    });
  }
};

export const moveTab = async <T extends 'lists' | 'badges', U extends 'customPages' | 'watchlists'>(
  accountInfo: Readonly<BitBadgesUserInfo<bigint>>,
  direction: 'left' | 'right',
  tab: string,
  type: T,
  pageType: U
) => {
  if (direction === 'left') {
    const currIdx = accountInfo[pageType]?.[type]?.findIndex((x) => x.title === tab);
    if (currIdx === undefined || currIdx === -1) return;

    const newCustomPages = deepCopyPrimitives(accountInfo[pageType]?.[type] ?? []);
    const temp = newCustomPages[currIdx];
    newCustomPages[currIdx] = newCustomPages[currIdx - 1];
    newCustomPages[currIdx - 1] = temp;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists: (type === 'lists' ? newCustomPages : accountInfo[pageType]?.lists ?? []) as CustomListPage[],
        badges: (type === 'badges' ? newCustomPages : accountInfo[pageType]?.badges ?? []) as CustomPage<bigint>[]
      }
    });
  } else {
    const currIdx = accountInfo[pageType]?.[type]?.findIndex((x) => x.title === tab);
    if (currIdx === undefined || currIdx === -1) return;

    const newCustomPages = deepCopyPrimitives(accountInfo[pageType]?.[type] ?? []);
    const temp = newCustomPages[currIdx];
    newCustomPages[currIdx] = newCustomPages[currIdx + 1];
    newCustomPages[currIdx + 1] = temp;

    await updateProfileInfo(accountInfo.address, {
      [pageType]: {
        lists: (type === 'lists' ? newCustomPages : accountInfo[pageType]?.lists ?? []) as CustomListPage[],
        badges: (type === 'badges' ? newCustomPages : accountInfo[pageType]?.badges ?? []) as CustomPage<bigint>[]
      }
    });
  }
};
