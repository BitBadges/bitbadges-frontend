import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { DisconnectedWrapper } from '../wrappers/DisconnectedWrapper';

export const GenericModal = ({
  visible,
  setVisible,
  title,
  children,
  style,
  requireConnected,
  requireLoggedIn
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  requireConnected?: boolean;
  requireLoggedIn?: boolean;
}) => {
  return (
    <Modal
      title={
        <div className="primary-text inherit-bg">
          <b>{title}</b>
        </div>
      }
      open={visible}
      style={style}
      footer={null}
      closeIcon={<div className="primary-text inherit-bg">{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8
      }}
      onCancel={() => {
        setVisible(false);
      }}
      destroyOnClose={true}>
      {requireConnected || requireLoggedIn ? <DisconnectedWrapper requireLogin={requireLoggedIn} node={children} /> : children}
    </Modal>
  );
};
