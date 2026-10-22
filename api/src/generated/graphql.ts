import type { GraphQLResolveInfo } from 'graphql';
import type { Context } from '../context.ts';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Query = {
  __typename?: 'Query';
  /** The most recent quote for each symbol, A to Z. One request for a list page. */
  latestQuotes: Array<Quote>;
  /**
   * The most recent quotes for a symbol, returned oldest first.
   * `from` and `to` are YYYY-MM-DD (UTC) or ISO 8601 with a time zone; both are inclusive.
   * `limit` is 1 to 1000.
   * An unknown symbol returns an empty list.
   */
  quotes: Array<Quote>;
  /** All-time statistics for a symbol, or null if the symbol has no quotes. */
  summary?: Maybe<SymbolSummary>;
  /** Every symbol that has quotes, A to Z. */
  symbols: Array<Scalars['String']['output']>;
};


export type QueryQuotesArgs = {
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  symbol: Scalars['String']['input'];
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySummaryArgs = {
  symbol: Scalars['String']['input'];
};

/** One price sample for a symbol. */
export type Quote = {
  __typename?: 'Quote';
  /** Change from the previous close, in USD. */
  change: Scalars['Float']['output'];
  /** Price in USD. */
  price: Scalars['Float']['output'];
  symbol: Scalars['String']['output'];
  /** When the quote was taken: ISO 8601, UTC (e.g. 2026-10-21T19:40:00.000Z). */
  timestamp: Scalars['String']['output'];
};

/** All-time statistics for one symbol. */
export type SymbolSummary = {
  __typename?: 'SymbolSummary';
  /** Highest price ever recorded. */
  high?: Maybe<Scalars['Float']['output']>;
  /** The most recent quote. */
  latest?: Maybe<Quote>;
  /** Lowest price ever recorded. */
  low?: Maybe<Scalars['Float']['output']>;
  /** Number of quotes recorded. */
  samples: Scalars['Int']['output'];
  symbol: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Quote: ResolverTypeWrapper<Quote>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SymbolSummary: ResolverTypeWrapper<SymbolSummary>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  Query: Record<PropertyKey, never>;
  Quote: Quote;
  String: Scalars['String']['output'];
  SymbolSummary: SymbolSummary;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  latestQuotes?: Resolver<Array<ResolversTypes['Quote']>, ParentType, ContextType>;
  quotes?: Resolver<Array<ResolversTypes['Quote']>, ParentType, ContextType, RequireFields<QueryQuotesArgs, 'limit' | 'symbol'>>;
  summary?: Resolver<Maybe<ResolversTypes['SymbolSummary']>, ParentType, ContextType, RequireFields<QuerySummaryArgs, 'symbol'>>;
  symbols?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type QuoteResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Quote'] = ResolversParentTypes['Quote']> = {
  change?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  symbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SymbolSummaryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SymbolSummary'] = ResolversParentTypes['SymbolSummary']> = {
  high?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  latest?: Resolver<Maybe<ResolversTypes['Quote']>, ParentType, ContextType>;
  low?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  samples?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  symbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Query?: QueryResolvers<ContextType>;
  Quote?: QuoteResolvers<ContextType>;
  SymbolSummary?: SymbolSummaryResolvers<ContextType>;
};

