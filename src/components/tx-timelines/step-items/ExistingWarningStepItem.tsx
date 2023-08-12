import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Tooltip, Typography } from "antd";

export function ExistingWarningStepItem() {

  return {
    title: 'Compatibility Notice',
    description: '',
    node: <div className="primary-text" style={{ textAlign: 'center' }}>
      <Typography.Text className='full-width' style={{ color: 'orange', textAlign: 'center', fontSize: 16 }}>
        <WarningOutlined style={{ color: 'orange', marginRight: 8 }} />
        Please Confirm
      </Typography.Text>
      <p>
        If this collection was created or updated previously using custom implementations (other than this form <Tooltip title="This only applies to manager-specific transactions that update core collection details such as transferability, permissions, etc. Third-party transfer and read-only verification tools are okay.">
          <InfoCircleOutlined style={{ marginLeft: 4, marginRight: 4 }} />
        </Tooltip>), please be aware that some features may not be supported.
      </p>
      <br />
      <p>
        Thank you for your understanding. We are working on 100% compatibility with all functionality in the future, regardless of the implementations used.
      </p>
    </div>
  }
}