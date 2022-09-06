import { useNavigate } from 'react-router-dom';
import React from 'react';
import { Menu, Dropdown, Popover, MenuTheme } from 'antd';

export function Tabs({ setTab, tabInfo, fullWidth, theme, noSelectedKeys }: {
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
                    textAlign: 'center',
                    float: 'left',
                }}
                key={tab.key}
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
                    // onClick={() => {
                    //     navigate(tab.key);
                    // }}
                    trigger={tab.subMenuTrigger}
                >
                    {menuItem}
                </Dropdown>
            );
        } else if (tab.popoverContent) {
            return <Popover content={tab.popoverContent}>{menuItem}</Popover>;
        } else {
            return menuItem;
        }
    });

    return (
        <Menu
            style={{ display: 'flex' }}
            theme={theme ? theme : 'dark'}
            mode="horizontal"
            defaultSelectedKeys={noSelectedKeys ? undefined : [tabInfo[0].key]}
            selectedKeys={noSelectedKeys ? [] : undefined}
            disabledOverflow
        >
            {tabs}
        </Menu>
    );
}
