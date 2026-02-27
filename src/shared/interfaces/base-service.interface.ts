export interface IBaseService<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: Record<string, unknown>): Promise<T[]>;
}
