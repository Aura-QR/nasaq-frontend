import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "react-auth-kit";
import { Provider } from "react-redux";
import store from "./store";
import Login from "./pages/Login/Login";
import { CacheProvider } from "@emotion/react";
import { theme, cacheRtl } from "@/utils/theme/theme";
import { ThemeProvider } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { appRoutes } from "./routes";
import "react-toastify/dist/ReactToastify.css";
import NoAccess from "./pages/Others/NoAccess";

function App() {
  return (
    <AuthProvider authType="cookie" authName="_auth" cookieDomain={window.location.hostname}>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/no-access" element={
                  <RequireAuth loginPath="/"> <NoAccess /> </RequireAuth>
                } />
                {appRoutes}
              </Routes>
            </BrowserRouter>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </Provider>
        </ThemeProvider>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
