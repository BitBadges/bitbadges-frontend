import { Avatar } from "antd";
import Blockies from 'react-blockies';

export function BlockiesAvatar({
    address,
    // blockiesScale,
    avatar,
    fontSize,
    shape
}: {
    address: string;
    // blockiesScale?: number,
    avatar?: string
    fontSize?: number,
    shape?: 'circle' | 'square'
}) {
    if (avatar) {
        return <Avatar shape={shape ? shape : 'square'} src={avatar} size={fontSize ? fontSize : 20} />
    } else {
        return <Avatar shape={shape ? shape : 'square'} src={<Blockies scale={4} size={fontSize ? fontSize / 4 : 10} seed={address ? address.toLowerCase() : ''} />} size={fontSize ? fontSize : 20} />
    }
}