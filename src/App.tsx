import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
// Pages
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { UserDashboardPage } from './pages/UserDashboardPage.tsx';
import { CreateProductPage } from './pages/CreateProductPage.tsx';
import { AdminPanelPage } from './pages/AdminPanelPage.tsx';
import { AuthPages } from './pages/AuthPages.tsx';
import { StaticPages } from './pages/StaticPages.tsx';

export function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string | number) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    window.history.pushState({}, '', to);
    setCurrentPath(to.split('?')[0]);
    window.scrollTo(0, 0);
  };

  // Route matcher
  const renderRoute = () => {
    // 1. Product Detail Page: /produto/:slug
    if (currentPath.startsWith('/produto/')) {
      const slug = currentPath.replace('/produto/', '');
      return <ProductDetailPage identifier={slug} navigate={navigate} />;
    }

    // 2. Checkout: /checkout/:slug
    if (currentPath.startsWith('/checkout/')) {
      const slug = currentPath.replace('/checkout/', '');
      return <CheckoutPage slug={slug} navigate={navigate} />;
    }

    // 3. Static & Specific routes
    switch (currentPath) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/ebooks':
        return <CatalogPage initialType="ebook" navigate={navigate} />;
      case '/videos':
        return <CatalogPage initialType="video" navigate={navigate} />;
      case '/catalogo':
        return <CatalogPage navigate={navigate} />;
      case '/login':
        return <AuthPages mode="login" navigate={navigate} />;
      case '/criar-conta':
        return <AuthPages mode="register" navigate={navigate} />;
      case '/recuperar-senha':
        return <AuthPages mode="recover" navigate={navigate} />;
      case '/conta':
        return <AuthPages mode="profile" navigate={navigate} />;
      case '/carteira':
        return <UserDashboardPage initialTab="carteira" navigate={navigate} />;
      case '/meus-ebooks':
        return <UserDashboardPage initialTab="meus-ebooks" navigate={navigate} />;
      case '/meus-videos':
        return <UserDashboardPage initialTab="meus-videos" navigate={navigate} />;
      case '/meus-produtos':
        return <UserDashboardPage initialTab="meus-produtos" navigate={navigate} />;
      case '/afiliados':
        return <UserDashboardPage initialTab="afiliados" navigate={navigate} />;
      case '/minhas-vendas':
        return <UserDashboardPage initialTab="minhas-vendas" navigate={navigate} />;
      case '/levantamentos':
        return <UserDashboardPage initialTab="levantamentos" navigate={navigate} />;
      case '/criar-produto':
        return <CreateProductPage navigate={navigate} />;
      case '/admin':
        return <AdminPanelPage navigate={navigate} />;
      case '/sobre':
        return <StaticPages page="sobre" navigate={navigate} />;
      case '/contactos':
        return <StaticPages page="contactos" navigate={navigate} />;
      case '/termos':
        return <StaticPages page="termos" navigate={navigate} />;
      case '/privacidade':
        return <StaticPages page="privacidade" navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Navbar currentRoute={currentPath} navigate={navigate} />
      <main className="flex-1">
        {renderRoute()}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
