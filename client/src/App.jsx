import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { ToastContainer } from 'react-toastify';

const Landing = React.lazy(() => import('./pages/Landing'));
const NumberCallerPage = React.lazy(() => import('./pages/NumberCaller'));
const TvQRDisplayPage = React.lazy(() => import('./pages/TVQRDisplay'));
const TvNumberDisplayPage = React.lazy(() => import('./pages/TVNumberDisplay'));
const FrontFacingPage = React.lazy(() => import('./pages/FrontFacing'));
const TestSocketIo = React.lazy(() => import('./pages/TestSocketIo'));

const ProtectedPage = React.lazy(() => import('./pages/ProtectedPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <>
      <ToastContainer
        position='top-right'
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
            path='/numbercaller/:singleUseFacilityId'
            element={
              <ProtectedPage>
                <NumberCallerPage />
              </ProtectedPage>
            }
          />

          <Route path='/tv' element={<TvQRDisplayPage />} />
          <Route
            path='/tv/:multiId1/:multiId2'
            element={<TvNumberDisplayPage />}
          />
          <Route
            path='/ff/:singleUseFacilityId'
            element={<FrontFacingPage />}
          />

          <Route path='/test' element={<TestSocketIo />} />

          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
