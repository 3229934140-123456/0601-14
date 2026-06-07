import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AccountCheck from '@/pages/AccountCheck/AccountCheck';
import Products from '@/pages/Products/Products';
import Script from '@/pages/Script/Script';
import Control from '@/pages/Control/Control';
import Danmaku from '@/pages/Danmaku/Danmaku';
import Review from '@/pages/Review/Review';
import Tasks from '@/pages/Tasks/Tasks';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/account-check" element={<AccountCheck />} />
          <Route path="/products" element={<Products />} />
          <Route path="/script" element={<Script />} />
          <Route path="/control" element={<Control />} />
          <Route path="/danmaku" element={<Danmaku />} />
          <Route path="/review" element={<Review />} />
          <Route path="/tasks" element={<Tasks />} />
        </Route>
      </Routes>
    </Router>
  );
}
