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
  hideText?: boolean
  secondary?: boolean
  noMinWidth?: boolean
}

const IconButton: React.FC<IconButtonProps> = ({ noMinWidth, secondary, src, text, style, onClick, tooltipMessage, size, disabled, hideText }) => {
  return (
    <Tooltip title={tooltipMessage ?? text} color='black' placement='bottom'>

      <div className='flex-center flex-column' style={{ margin: noMinWidth ? undefined : 8, marginLeft: 8, minWidth: noMinWidth ? undefined : 60, }}>
        <Avatar
          className={secondary ? 'styled-button-normal' : 'styled-icon-button'}
          src={src}
          style={{

            backgroundColor: disabled ? 'lightgrey' : undefined,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',

            ...style,
          }}
          onClick={disabled ? undefined : onClick}
          size={size}
        />
        {!hideText &&
          <div className='primary-text flex-center' style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
            {text}
          </div>}
      </div>
    </Tooltip >
  );
};

export default IconButton;
