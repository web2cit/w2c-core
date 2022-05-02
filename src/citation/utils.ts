// from https://stackoverflow.com/questions/55046211/typescript-check-if-type-a-type-b-type-c
// and https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

export function assert<T extends boolean>(expect: T) {
  return expect;
}

// see https://github.com/Microsoft/TypeScript/issues/24274
export type Implements<T, R extends T> = R;

// https://stackoverflow.com/questions/57571664/typescript-type-for-an-object-with-only-one-key-no-union-type-allowed-as-a-key
export type OneKey<K extends string, V = any> = {
  [P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never;
}[K];
