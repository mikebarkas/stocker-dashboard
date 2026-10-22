import { Link } from "react-router";

export function NotFound() {
  return (
    <section>
      <title>Page not found · Stocker</title>
      <h1>Page not found</h1>
      <Link className="back" to="/">
        ← All stocks
      </Link>
    </section>
  );
}
