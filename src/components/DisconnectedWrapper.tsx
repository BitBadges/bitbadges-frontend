import Search from 'antd/lib/input/Search';
import { useSelector } from 'react-redux';
import { Tabs } from './Tabs';
import Blockies from 'react-blockies';
import {
    GlobalOutlined,
    HomeOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Typography, Layout, Select, message, Avatar, Menu, Tooltip } from 'antd';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BlockinDisplay } from './blockin/BlockinDisplay';
import { getAbbreviatedAddress } from '../utils/AddressUtils';
import { useChainContext } from '../chain_handlers_frontend/ChainContext';
import ConnectScreen from '../pages/connect';

const { Header } = Layout;
const { Option } = Select;

export function DisconnectedWrapper({ node, message }: { node: JSX.Element, message?: string }) {
    const chain = useChainContext();
    const address = chain.address;
    // const loggedIn = chain.loggedIn;
    const loggedIn = true; //TODO: change

    return (
        <>
            {address && loggedIn ? node : <ConnectScreen message={message} />}
        </>
    );
}
