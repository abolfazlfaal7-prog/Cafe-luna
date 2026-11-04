import AdminPage from '@/pages/AdminPage';
import MenuPage from '@/pages/MenuPage';

function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '').startsWith('/admin');
  return isAdminRoute ? <AdminPage /> : <MenuPage />;
}

export default App;
