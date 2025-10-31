import React from 'react';
import Layout from '../container/Layout';
import Ventas from '../container/Ventas';
import Compras from '../container/Compras';
import MainPage from '../components/MainPage';
import LoginPage from '../container/LoginPage';
import { AuthProvider } from '../components/Auth';
import MisionVision from '../container/MisionVision';
import Brigadas from '../components/Brigadas';
import Tutoriales from '../container/Tutoriales';
import AgendarCita from '../components/AgendarCita';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path='/login' element={<LoginPage />} />
          </Routes>

          <Layout>
            <Routes>
              <Route path='/' element={<MainPage />} />
              <Route path='/compras' element={<Compras />} />
              <Route path='/ventas' element={<Ventas />} />
              <Route path='/mision_vision' element={<MisionVision />} />
              <Route path='/brigadas_empresariales' element={<Brigadas />} />
              <Route path='/tutoriales' element={<Tutoriales />} />
              <Route path='/agendar_cita' element={<AgendarCita />} />
              <Route path='*' element={<h2>Not found</h2>} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
