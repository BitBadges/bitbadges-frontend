import { DeleteOutlined, LeftOutlined } from '@ant-design/icons';
import { Dropdown, Menu, MenuTheme, Popover } from 'antd';
import IconButton from '../display/IconButton';

export function Tabs({
  hideOnSingleTab,
  type, style, tab, setTab, tabInfo, fullWidth, theme, noSelectedKeys, customClass, onDeleteCurrTab,
  onLeftRight,
  showLeft,
  showRight,

}: {
  tab: string;
  setTab: (tab: string) => void;
  tabInfo: ({ key: string, content: string | JSX.Element, disabled?: boolean, onClick?: () => void, subMenuOverlay?: JSX.Element, subMenuTrigger?: ("contextMenu" | "click" | "hover")[], popoverContent?: JSX.Element } | undefined)[];
  fullWidth?: boolean;
  theme?: MenuTheme;
  noSelectedKeys?: boolean;
  type?: 'underline' | 'default';
  customClass?: string;
  onDeleteCurrTab?: (tab: string) => Promise<void>;
  style?: React.CSSProperties;
  hideOnSingleTab?: boolean;
  onLeftRight?: (direction: 'left' | 'right') => Promise<void>;
  showLeft?: boolean;
  showRight?: boolean;
}) {
  let tabInfoFiltered = tabInfo.filter((tab) => tab != undefined) as { key: string, content: string | JSX.Element, disabled?: boolean, onClick?: () => void, subMenuOverlay?: JSX.Element, subMenuTrigger?: ("contextMenu" | "click" | "hover")[], popoverContent?: JSX.Element }[];

  if (hideOnSingleTab && tabInfoFiltered.length == 1) {
    return <></>
  }

  const widthPerTab = fullWidth
    ? `calc(100% / ${tabInfoFiltered.length})`
    : undefined;
  const selectedTab = tab

  if (onDeleteCurrTab) {
    tabInfoFiltered = tabInfoFiltered.map((tab) => {
      if (tab.key == selectedTab) {
        return {
          ...tab,
          content: <div className='flex-center' style={{}}>
            {tab.key}
            {showLeft && onLeftRight && <IconButton
              text=''
              noMinWidth
              onClick={async () => {
                await onLeftRight('left');
              }}
              src={<LeftOutlined />}
            />}
            {showRight && onLeftRight && <IconButton
              text=''
              noMinWidth
              onClick={async () => {
                await onLeftRight('right');
              }}
              src={<LeftOutlined style={{ transform: 'rotate(180deg)' }} />}
            />}
            {<>
              <IconButton
                text=''
                noMinWidth
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete?')) {
                    return
                  }

                  await onDeleteCurrTab(tab.key);

                  //first tab that is not this one
                  const newTab = tabInfoFiltered.find(x => x.key != tab.key)?.key ?? '';
                  setTab(newTab);
                }}
                src={<DeleteOutlined />}
              />
            </>}
          </div>,
        }
      } else {
        return tab;
      }
    })
  }


  const tabs = tabInfoFiltered.map((tab,) => {
    const menuItem = (
      <Menu.Item
        disabled={tab.disabled}
        style={{
          marginLeft: 1,
          marginRight: 1,
          width: widthPerTab,
          minWidth: 'fit-content',
          textAlign: 'center',
          float: 'left',
          backgroundColor: type == 'underline' ?

            'inherit' : undefined,
          // borderBottom: type == 'underline' ? '2px solid blue' : undefined,
          color: tab.key == selectedTab && type != 'underline' ? 'white' : undefined,
          borderBottom: type == 'underline' && selectedTab == tab.key ? '2px solid blue' : undefined,
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
        className={
          'primary-text   inherit-bg border-vivid-blue ' + (customClass ? ' ' + customClass : '') + (type !== 'underline' ? ' rounded-lg' : '')
        }          >
        <div className={'primary-text ' + (type == 'underline' ? ' hover:text-gray-400' : '')}
          style={{
            color: tab.key == selectedTab && type != 'underline' ? 'white' : undefined,
            fontSize: 18, fontWeight: 'bolder'
          }}>
          {tab.content}
        </div>

      </Menu.Item >
    );
    if (tab.subMenuOverlay) {
      return (
        <Dropdown
          className='primary-text dark'
          placement="bottom"
          overlay={tab.subMenuOverlay ?
            <div className='primary-text'>
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
        content={tab.popoverContent} placement='bottom'>
        {menuItem}
      </Popover>;
    } else {
      return menuItem;
    }
  });



  return (
    <Menu
      style={{ display: 'flex', overflow: 'auto', ...style }}
      theme={theme ? theme : 'dark'}
      mode="horizontal"
      selectedKeys={noSelectedKeys ? [] : [tab]}
      disabledOverflow
    >
      {tabs}
    </Menu>
  );
}
