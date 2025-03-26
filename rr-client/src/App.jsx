import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { ToastContainer } from 'react-toastify';

const Landing = React.lazy(() => import('./pages/Landing'));
const TestSocketIo = React.lazy(() => import('./pages/TestSocketIo'));
const TvQRDisplayPage = React.lazy(() => import('./pages/TVQRDisplay'));
const NumberCallerPage = React.lazy(() => import('./pages/NumberCaller'));
const FrontFacingPage = React.lazy(() => import('./pages/FrontFacing'));

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <BrowserRouter>
        <Routes>
          <Route index element={<Landing />} />

          <Route
            path="/numbercaller/:singleUseFacilityId"
            element={<NumberCallerPage />}
          />
          <Route path="/tv" element={<TvQRDisplayPage />} />
          <Route
            path="/ff/:singleUseFacilityId"
            element={<FrontFacingPage />}
          />

          <Route path="/test" element={<TestSocketIo />} />

          <Route
            path="*"
            element={<div className="bg-conic">404 Not Found</div>}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
