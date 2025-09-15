declare module 'csv-parse/sync' {
  import type { Options } from 'csv-parse';
  export function parse(input: string, options?: Options): any[];
}
