import { Pagination as PaginationAntD } from 'antd';

export function Pagination({ currPage, onChange, total, pageSize, showOnSinglePage, lightTheme, showPageJumper }: {
  lightTheme?: boolean, currPage: number, onChange: (page: number) => void, total: number, pageSize: number, showOnSinglePage?: boolean, showPageJumper?: boolean
}) {
  return <div className='flex-center'>
    <PaginationAntD
      className={lightTheme ? undefined : 'primary-text inherit-bg dark'}
      style={{ fontSize: 14 }}
      defaultCurrent={1}
      current={currPage}
      total={total}
      pageSize={pageSize}
      onChange={(page) => {
        onChange(page);
      }}
      showLessItems
      showSizeChanger={false}
      size='small'
      hideOnSinglePage={!showOnSinglePage}
      showQuickJumper={showPageJumper}
      showTotal={showPageJumper ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : undefined}
    />
  </div>
}