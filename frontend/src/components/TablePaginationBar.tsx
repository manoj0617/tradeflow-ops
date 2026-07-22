import { TablePagination } from '@mui/material';

export function TablePaginationBar({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page - 1}
      rowsPerPage={limit}
      onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
      onRowsPerPageChange={(event) => onLimitChange(Number(event.target.value))}
      rowsPerPageOptions={[10, 20, 50]}
      labelRowsPerPage="Rows"
    />
  );
}

