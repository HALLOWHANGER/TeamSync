import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./protected.route";
import AuthRoute from "./auth.route";
import {
  authenticationRoutePaths,
  baseRoutePaths,
  chatRoutePaths,
  protectedRoutePaths,
  commonRoutePaths,
} from "./common/routes";
import AppLayout from "@/layout/app.layout";
import ChatLayout from "@/layout/chat.layout";
import BaseLayout from "@/layout/base.layout";
import NotFound from "@/page/errors/NotFound";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BaseLayout />}>
          {commonRoutePaths.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {baseRoutePaths.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Route>

        <Route element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* Normal workspace pages — header + padding */}
          <Route element={<AppLayout />}>
            {protectedRoutePaths.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Route>

          {/* Chat pages — same sidebar, full-height layout with chat list */}
          <Route element={<ChatLayout />}>
            {chatRoutePaths.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
