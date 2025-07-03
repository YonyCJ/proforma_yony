export interface PagedResult<T> {
  content: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}
