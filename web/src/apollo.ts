// Apollo Client: sends GraphQL requests and caches the results. The cache is
// the app's store for server data (the job Redux + thunks did in 2020):
// components ask for data with useQuery, and Apollo fetches, caches, and
// re-renders them. There are no actions or reducers to write.
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_API_URL ?? "/graphql" }),
  cache: new InMemoryCache(),
});
