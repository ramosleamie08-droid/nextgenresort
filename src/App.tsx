import { Navigate, Route, Routes } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Home from './pages/Home';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import CustomerLayout from './pages/customer/CustomerLayout';
import AdminLayout from './pages/admin/AdminLayout';
import { AuthProvider } from './context/AuthContext';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter basename="/nextgenresort">
        {/* TINANGGAL ANG AdminMenu DITO */}
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          
          <Route path="/customer/*" element={<CustomerLayout />} />
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;