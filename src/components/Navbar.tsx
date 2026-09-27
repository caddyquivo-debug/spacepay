import React, { useState } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';
import {
  BookOpen,
  Video,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Wallet,
  Share2,
  PackageCheck,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition-colors">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Space<span className="text-emerald-600">Pay</span>
                </span>
                <span className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase">
                  eBooks & Vídeos
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleNav('/')}
              className={`hover:text-emerald-600 transition-colors cursor-pointer ${
                currentRoute === '/' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNav('/ebooks')}
              className={`flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer ${
                currentRoute === '/ebooks' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              eBooks
            </button>
            <button
              onClick={() => handleNav('/videos')}
              className={`flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer ${
                currentRoute === '/videos' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              <Video className="w-4 h-4 text-emerald-600" />
              Vídeos de Dicas
            </button>
            <button
              onClick={() => handleNav('/afiliados')}
              className={`flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer ${
                currentRoute === '/afiliados' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              Afiliados
            </button>
            <button
              onClick={() => handleNav('/sobre')}
              className={`hover:text-emerald-600 transition-colors cursor-pointer ${
                currentRoute === '/sobre' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              Sobre
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Painel Admin
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span className="text-emerald-700 font-semibold tabular-nums ml-1">
                    {user.wallet.availableBalance.toLocaleString('pt-MZ')} MT
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Saldo Disponível:</span>
                        <span className="font-bold text-emerald-600 tabular-nums">
                          {user.wallet.availableBalance.toLocaleString('pt-MZ')} MT
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNav('/conta')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Minha Conta & Perfil
                    </button>
                    <button
                      onClick={() => handleNav('/carteira')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      Minha Carteira & Ganhos
                    </button>
                    <button
                      onClick={() => handleNav('/meus-ebooks')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      Meus eBooks Comprados
                    </button>
                    <button
                      onClick={() => handleNav('/meus-videos')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-slate-400" />
                      Meus Vídeos de Dicas
                    </button>
                    <button
                      onClick={() => handleNav('/afiliados')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                      Área de Afiliado (Links & Lucros)
                    </button>
                    <button
                      onClick={() => handleNav('/carteira')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-slate-400" />
                      Minha Carteira & Levantamentos
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 font-bold flex items-center gap-2.5 cursor-pointer border-t border-emerald-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        Painel de Controle Admin
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          handleNav('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login?role=cliente')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Acessar como Comprador / Leitor"
                >
                  Entrar como Cliente
                </button>
                <button
                  onClick={() => handleNav('/login?role=vendedor')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  title="Acessar como Criador / Vendedor / Afiliado"
                >
                  Entrar como Vendedor
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="space-y-1">
            <button
              onClick={() => handleNav('/')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Início
            </button>
            <button
              onClick={() => handleNav('/ebooks')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              eBooks
            </button>
            <button
              onClick={() => handleNav('/videos')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-emerald-600" />
              Vídeos de Dicas
            </button>
            <button
              onClick={() => handleNav('/afiliados')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              Sistema de Afiliados
            </button>
            <button
              onClick={() => handleNav('/catalogo')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Ver Catálogo Completo
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-800 bg-emerald-100/70 rounded-lg flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Painel Administrativo
              </button>
            )}
          </nav>

          {user ? (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <div className="text-xs font-bold text-slate-800">{user.name}</div>
                <div className="text-xs text-emerald-600 font-semibold tabular-nums">
                  Saldo: {user.wallet.availableBalance.toLocaleString('pt-MZ')} MT
                </div>
              </div>
              <button
                onClick={() => handleNav('/conta')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
              >
                Minha Conta & Carteira
              </button>
              <button
                onClick={() => handleNav('/meus-ebooks')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
              >
                Meus eBooks
              </button>
              <button
                onClick={() => handleNav('/meus-videos')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
              >
                Meus Vídeos
              </button>
              <button
                onClick={() => handleNav('/levantamentos')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
              >
                Levantamentos
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded"
              >
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => handleNav('/login?role=cliente')}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl"
              >
                Entrar como Cliente
              </button>
              <button
                onClick={() => handleNav('/login?role=vendedor')}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-xs"
              >
                Entrar como Vendedor
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
