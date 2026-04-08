import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';
import './palette.css';
import './index.css';

import { App } from './App.tsx';
import { Location } from "./Location.tsx";
import { ErrorBoundary } from "./Error.tsx";

import locationsCSV from './locations.csv?raw';
import { loadPreferences } from './Storage.ts';

// Apply saved theme before first render
document.documentElement.setAttribute('data-theme', loadPreferences().theme);

const items = locationsCSV.trim().split('\n').slice(1).map(line => {
  const [name, slug, latitude, longitude] = line.split(',');
  return { name, slug, latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "/:slug",
    errorElement: <ErrorBoundary />, 
    loader: ({ params }) => {
      const item = items.find(it => it.slug === params.slug);
      if (!item) throw new Response("Not Found", { status: 404 });
      return item;
    },
    element: <LocationWrapper />
  }
], {
  basename: import.meta.env.PROD ? "/galim" : undefined
});

function LocationWrapper() {
  const item = useLoaderData() as typeof items[0];
  return <Location name={item.name} slug={item.slug} latitude={item.latitude} longitude={item.longitude} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)