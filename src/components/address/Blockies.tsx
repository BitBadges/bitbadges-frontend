import { Avatar } from "antd";
import Blockies from 'react-blockies';

export function BlockiesAvatar({
    address,
    blockiesScale,
    avatar
}: {
    address: string;
    blockiesScale?: number,
    avatar?: string
}) {
    if (avatar) {
        return <Avatar shape='square' src={avatar} size={blockiesScale ? 4 * blockiesScale : undefined} />
    } else {
        return <Blockies size={blockiesScale} seed={address ? address.toLowerCase() : ''} />
    }
}