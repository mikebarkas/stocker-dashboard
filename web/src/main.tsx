import { ApolloProvider } from "@apollo/client/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { client } from "./apollo";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found");

// Providers make something available to every component below them through
// React context: the Apollo client (for useQuery) and the router (for
// <Link>, useParams). Like <Provider store={store}> with Redux.
createRoot(root).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>,
);
