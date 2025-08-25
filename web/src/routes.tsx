import { createBrowserRouter } from "react-router-dom";
import ChartPage from "./pages/ChartPage";
import EtlPage from "./pages/EtlPage";
export const router = createBrowserRouter([
  { path: "/", element: <ChartPage /> },
  { path: "/etl", element: <EtlPage /> },
]);
