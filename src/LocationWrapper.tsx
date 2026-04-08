import { useLoaderData } from "react-router-dom";
import { Location } from "./Location.tsx";

export function LocationWrapper() {
  const item = useLoaderData() as { name: string; slug: string; latitude: number; longitude: number };
  return <Location name={item.name} slug={item.slug} latitude={item.latitude} longitude={item.longitude} />;
}
