import { Dropdown, Menu, MenuTheme, Popover } from 'antd';

export function Tabs({ tab, setTab, tabInfo, fullWidth, theme, noSelectedKeys, customClass }: {
  tab: string;
  setTab: (tab: string) => void;
  tabInfo: { key: string, content: string | JSX.Element, disabled?: boolean, onClick?: () => void, subMenuOverlay?: JSX.Element, subMenuTrigger?: ("contextMenu" | "click" | "hover")[], popoverContent?: JSX.Element }[];
  fullWidth?: boolean;
  theme?: MenuTheme;
  noSelectedKeys?: boolean;
  customClass?: string;
}) {
  const widthPerTab = fullWidth
    ? `calc(100% / ${tabInfo.length})`
    : undefined;

  const tabs = tabInfo.map((tab,) => {
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
        className={'inherit-bg hover:bg-vivid-blue' + (customClass ? ' ' + customClass : '')}
      >
        {tab.content}
      </Menu.Item>
    );
    if (tab.subMenuOverlay) {
      return (
        <Dropdown
          className='dark:text-white dark'
          placement="bottom"
          overlay={tab.subMenuOverlay ?
            <div className='dark:text-white'>
              {tab.subMenuOverlay}
            </div> : <></>}
          trigger={tab.subMenuTrigger}
          key={`${tab.key}`}
        >
          {menuItem}
        </Dropdown>
      );
    } else if (tab.popoverContent) {
      return <Popover key={`${tab.key}`}
        className='full-width'
        style={{ width: widthPerTab }}
        content={tab.popoverContent} placement='bottom'>{menuItem}</Popover>;
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
