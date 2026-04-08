import {
  useRouteError,
  isRouteErrorResponse,
} from "react-router-dom";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <p>{error.status}: {error.statusText}</p>;
  }
  return <p>Something went wrong: {String(error)}</p>;
}
