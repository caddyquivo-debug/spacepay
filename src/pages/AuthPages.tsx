import React, { useState } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Video,
  Wallet,
  Share2,
  Sparkles,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface AuthPagesProps {
  mode: 'login' | 'register' | 'recover' | 'profile';
  navigate: (route: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, navigate }) => {
  const { user, login, register, logout, isAdmin } = useAuth();

  const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'recover' | 'profile'>(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsRegistrationPrompt, setNeedsRegistrationPrompt] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNeedsRegistrationPrompt(false);
    setLoading(true);

    try {
      if (currentMode === 'login') {
        if (!email.trim()) throw new Error('Por favor insira seu email.');
        await login(email.trim());
        navigate('/meus-ebooks');
      } else if (currentMode === 'register') {
        if (!name.trim() || !email.trim()) throw new Error('Nome completo e email são obrigatórios.');
        await register(name.trim(), email.trim(), phone.trim());
        navigate('/meus-ebooks');
      } else if (currentMode === 'recover') {
        if (!email.trim()) throw new Error('Insira seu email para recuperação.');
        const res = await api.recoverPassword(email.trim());
        setSuccess(res.message);
      }
    } catch (err: any) {
      const msg = err.message || 'Erro na operação.';
      setError(msg);
      // Check if server indicated that user needs to register first
      if (
        msg.includes('primeiro abrir uma conta') ||
        msg.includes('primeiro criar uma conta') ||
        msg.includes('Nenhuma conta encontrada')
      ) {
        setNeedsRegistrationPrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDirectLogin = async () => {
    setEmail(ADMIN_EMAIL);
    setError(null);
    setLoading(true);
    try {
      await login(ADMIN_EMAIL);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como administrador.');
    } finally {
      setLoading(false);
    }
  };

  if (currentMode === 'profile' && user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500 font-mono">{user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {user.role === 'admin' ? 'Administrador Oficial' : 'Cliente SpacePay'}
                </span>
                <span className="text-[11px] text-slate-400">ID: {user.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Choice of Panels for Logged in User */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Acesso Rápido à Sua Conta:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/meus-ebooks')}
                className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Meus eBooks</div>
                  <div className="text-[11px] text-slate-500">Biblioteca digital e downloads</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/meus-videos')}
                className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Meus Vídeos de Dicas</div>
                  <div className="text-[11px] text-slate-500">Aulas rápidas em vídeo</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/afiliados')}
                className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Área de Afiliado</div>
                  <div className="text-[11px] text-slate-500">Seus links e comissões</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/carteira')}
                className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Minha Carteira</div>
                  <div className="text-[11px] text-slate-500">Saldo e levantamentos M-Pesa</div>
                </div>
              </button>
            </div>

            {isAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-left transition-all cursor-pointer flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <div className="text-xs font-bold">Painel de Gestão da Plataforma (Admin)</div>
                      <div className="text-[11px] text-emerald-100">Controle total de produtos, vendas e comissões</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                    Acessar
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100 text-xs text-slate-600">
            <div className="py-3 flex justify-between">
              <span>Nome Completo:</span>
              <strong className="text-slate-900">{user.name}</strong>
            </div>
            <div className="py-3 flex justify-between">
              <span>Email:</span>
              <strong className="text-slate-900 font-mono">{user.email}</strong>
            </div>
            <div className="py-3 flex justify-between">
              <span>Telemóvel Registrado:</span>
              <strong className="text-slate-900">{user.phone || 'Não informado'}</strong>
            </div>
            <div className="py-3 flex justify-between">
              <span>Saldo Disponível na Carteira:</span>
              <strong className="text-emerald-600 font-bold tabular-nums">
                {user.wallet.availableBalance.toLocaleString('pt-MZ')} MT
              </strong>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => navigate('/catalogo')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center shadow-sm"
            >
              Explorar Catálogo
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-sm mb-3">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {currentMode === 'login' && 'Entrar na sua Conta SpacePay'}
            {currentMode === 'register' && 'Abrir Conta no SpacePay'}
            {currentMode === 'recover' && 'Recuperar Acesso à Conta'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {currentMode === 'login' && 'Acesse seus eBooks, vídeos de dicas adquiridos e comissões de afiliado.'}
            {currentMode === 'register' && 'Crie sua conta pessoal para comprar infoprodutos e participar do programa de afiliados.'}
            {currentMode === 'recover' && 'Insira seu email para recuperar o acesso à sua conta.'}
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Needs Registration Prompt Box */}
        {needsRegistrationPrompt && currentMode === 'login' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Você precisa abrir uma conta primeiro</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              O email <strong>{email}</strong> ainda não está cadastrado no SpacePay. Clique abaixo para abrir sua conta em menos de 1 minuto:
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setNeedsRegistrationPrompt(false);
                setCurrentMode('register');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Abrir Minha Conta Agora
            </button>
          </div>
        )}

        {/* Success Feedback */}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {currentMode === 'register' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {currentMode === 'register' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Telemóvel (M-Pesa / mCash)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+258 84... ou 82..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Utilizado para confirmações e recebimento de comissões via M-Pesa.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Aguarde...</span>
            ) : currentMode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar na Minha Conta</span>
              </>
            ) : currentMode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Abrir Minha Conta SpacePay</span>
              </>
            ) : (
              <span>Enviar Link de Recuperação</span>
            )}
          </button>
        </form>

        {/* Footer toggles between modes */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-500">
          {currentMode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => setCurrentMode('recover')}
                className="hover:text-slate-800 transition-colors cursor-pointer"
              >
                Esqueceu o acesso?
              </button>
              <div className="text-center pt-1">
                Não tem uma conta cadastrada?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setNeedsRegistrationPrompt(false);
                    setCurrentMode('register');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Abrir conta agora
                </button>
              </div>
            </>
          )}

          {currentMode === 'register' && (
            <div>
              Já abriu sua conta anteriormente?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentMode('login');
                }}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Fazer login
              </button>
            </div>
          )}

          {currentMode === 'recover' && (
            <button
              type="button"
              onClick={() => setCurrentMode('login')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
