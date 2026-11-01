/**
 * Standard ApiResponse format matching Spring Boot microservices backend
 */
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
  timestamp?: string;
}
