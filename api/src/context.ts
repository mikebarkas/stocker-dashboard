import type pg from "pg";

// The context object is passed to every resolver as its third argument.
// It holds what resolvers share: here, the database pool.
export interface Context {
  pool: pg.Pool;
}
