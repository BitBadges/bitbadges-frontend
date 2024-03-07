import { Avatar } from 'antd';
import Blockies from 'react-blockies';

export function BlockiesAvatar({
  address,
  avatar,
  fontSize,
  shape = 'square'
}: {
  address: string;
  avatar?: string;
  fontSize?: number;
  shape?: 'circle' | 'square';
}) {
  if (avatar) {
    return <Avatar className="rounded" shape={shape ? shape : 'square'} src={avatar} size={fontSize ? fontSize : 20} />;
  } else {
    return (
      <Avatar
        className="rounded"
        shape={shape ? shape : 'square'}
        src={
          <Blockies
            color={address == 'All' ? 'white' : undefined}
            spotColor={address == 'All' ? '#FF5733' : undefined}
            bgColor={address == 'All' ? 'green' : undefined}
            scale={4}
            size={fontSize ? fontSize / 4 : 10}
            seed={address ? address.toLowerCase() : ''}
          />
        }
        size={fontSize ? fontSize : 20}
      />
    );
  }
}
