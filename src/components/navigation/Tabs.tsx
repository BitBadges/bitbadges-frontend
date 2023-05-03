import { Dropdown, Menu, MenuTheme, Popover } from 'antd';

export function Tabs({ tab, setTab, tabInfo, fullWidth, theme, noSelectedKeys }: {
  tab: string;
  setTab: (tab: string) => void;
  tabInfo: { key: string, content: string | JSX.Element, disabled?: boolean, onClick?: () => void, subMenuOverlay?: JSX.Element, subMenuTrigger?: ("contextMenu" | "click" | "hover")[], popoverContent?: JSX.Element }[];
  fullWidth?: boolean;
  theme?: MenuTheme;
  noSelectedKeys?: boolean;
}) {
  const widthPerTab = fullWidth
    ? `calc(100% / ${tabInfo.length})`
    : undefined;

  const tabs = tabInfo.map((tab) => {
    const menuItem = (
      <Menu.Item
        disabled={tab.disabled}
        style={{
          width: widthPerTab,
          minWidth: 'fit-content',
          textAlign: 'center',
          float: 'left',

        }}
        key={`${tab.key}`}
        onClick={
          tab.onClick
            ? tab.onClick
            : () => {
              setTab(tab.key);
            }
        }
        id={tab.key}
      >
        {tab.content}
      </Menu.Item>
    );
    if (tab.subMenuOverlay) {
      return (
        <Dropdown
          placement="bottom"
          overlay={tab.subMenuOverlay ? tab.subMenuOverlay : <></>}
          trigger={tab.subMenuTrigger}
          key={`${tab.key}`}
        >
          {menuItem}
        </Dropdown>
      );
    } else if (tab.popoverContent) {
      return <Popover key={`${tab.key}`} content={tab.popoverContent}>{menuItem}</Popover>;
    } else {
      return menuItem;
    }
  });



  return (
    <Menu
      style={{ display: 'flex', overflow: 'auto' }}
      theme={theme ? theme : 'dark'}
      mode="horizontal"
      selectedKeys={noSelectedKeys ? [] : [tab]}
      disabledOverflow
    >
      {tabs}
    </Menu>
  );
}
