
import { Empty } from 'antd';

export function EmptyIcon({ description }: { description?: string }) {
  return <Empty className='full-width secondary-text inherit-bg' image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
}