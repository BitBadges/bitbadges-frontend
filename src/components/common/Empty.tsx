
import { Empty } from 'antd';

export function EmptyIcon({ description }: { description?: string }) {
  return <Empty className='full-width primary-text primary-blue-bg' image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
}