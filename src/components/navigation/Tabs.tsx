import { DeleteOutlined } from '@ant-design/icons';
import { Dropdown, Menu, MenuTheme, Popover } from 'antd';
import IconButton from '../display/IconButton';

export function Tabs({ type, style, tab, setTab, tabInfo, fullWidth, theme, noSelectedKeys, customClass, onDeleteCurrTab }: {
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
}) {
  let tabInfoFiltered = tabInfo.filter((tab) => tab != undefined) as { key: string, content: string | JSX.Element, disabled?: boolean, onClick?: () => void, subMenuOverlay?: JSX.Element, subMenuTrigger?: ("contextMenu" | "click" | "hover")[], popoverContent?: JSX.Element }[];

  const widthPerTab = fullWidth
    ? `calc(100% / ${tabInfoFiltered.length})`
    : undefined;
  const selectedTab = tab

  if (onDeleteCurrTab) {
    tabInfoFiltered = tabInfoFiltered.map((tab) => {
      if (tab.key == selectedTab) {
        return {
          ...tab,
          content: <div className='flex-center' style={{ marginLeft: 8 }}>
            {tab.key}
            {<>


              <IconButton
                text=''
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
          width: widthPerTab,
          minWidth: 'fit-content',
          textAlign: 'center',
          float: 'left',
          backgroundColor: type == 'underline' ? 'inherit' : undefined,
          // borderBottom: type == 'underline' ? '2px solid blue' : undefined,
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
          'primary-text inherit-bg ' + (customClass ? ' ' + customClass : '')}
      >
        <div className={'primary-text border-vivid-blue' + (type == 'underline' ? ' hover:text-gray-400' : '')}
          style={{
            color: tab.key == selectedTab && type != 'underline' ? 'white' : undefined,
            borderBottom: type == 'underline' && selectedTab == tab.key ? '2px solid blue' : undefined,
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
