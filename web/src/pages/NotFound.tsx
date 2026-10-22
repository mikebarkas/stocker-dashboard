import { Link } from "react-router";

export function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <Link to="/">Back to all symbols</Link>
    </section>
  );
}
