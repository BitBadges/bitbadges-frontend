import { Avatar } from "antd";
import Blockies from 'react-blockies';

export function BlockiesAvatar({
  address,
  avatar,
  fontSize,
  shape
}: {
  address: string;
  avatar?: string
  fontSize?: number,
  shape?: 'circle' | 'square',
}) {
  let mini = true;
  if (fontSize && fontSize > 20) {
    mini = false;
  }

  if (avatar) {
    return <Avatar shape={shape ? shape : 'square'} src={avatar} size={fontSize ? fontSize : 20} />
  } else {
    return <Avatar shape={shape ? shape : 'square'} src={<Blockies
      color={address == 'All' ? 'white' : address == 'Mint' ? 'orange' : undefined}
      spotColor={address == 'All' ? 'orange' : address == 'Mint' ? 'white' : undefined}
      bgColor={address == 'All' ? 'green' : address == 'Mint' ? 'white' : undefined}
      scale={mini ? 4 : 10} size={fontSize ? fontSize / 4 : 10
      } seed={address ? address.toLowerCase() : ''} />
    } size={fontSize ? fontSize : 20} />
  }
}