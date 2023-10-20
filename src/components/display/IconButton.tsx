import { Avatar, Tooltip } from 'antd';
import React, { ReactNode } from 'react';

interface IconButtonProps {
  src: ReactNode
  text: string
  tooltipMessage?: string
  style?: React.CSSProperties
  onClick?: () => void
  size?: number
  disabled?: boolean
  children?: ReactNode
}

const IconButton: React.FC<IconButtonProps> = ({ src, text, style, onClick, tooltipMessage, size, disabled }) => {


  return (
    <Tooltip title={tooltipMessage ?? text} color='black' placement='bottom'>

      <div className='flex-center flex-column' style={{ margin: 8, width: 60 }}>
        <Avatar
          className='styled-icon-button'
          src={src}
          style={{

            backgroundColor: disabled ? 'lightgrey' : undefined,
            cursor: disabled ? 'not-allowed' : 'pointer',
            ...style,
          }}
          onClick={onClick}
          size={size}
        />
        <div className='primary-text' style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
          {text}
        </div>
      </div>
    </Tooltip >
  );
};

export default IconButton;
