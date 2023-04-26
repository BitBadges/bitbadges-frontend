import { Avatar } from "antd";
import Blockies from 'react-blockies';

export function BlockiesAvatar({
    address,
    blockiesScale,
    avatar,
    fontSize
}: {
    address: string;
    blockiesScale?: number,
    avatar?: string
    fontSize?: number
}) {
    if (avatar) {
        return <Avatar shape='square' src={avatar} size={fontSize ? fontSize : 20} />
    } else {
        return <Avatar shape='square' src={<Blockies size={fontSize ? fontSize : 20} seed={address ? address.toLowerCase() : ''} />} size={fontSize ? fontSize : 20} />
    }
}