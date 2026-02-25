import React, { useState } from 'react';
import { User } from '../types';
import { hashPassword, verifyPassword } from '../utils/auth';

type Props = {
  users: User[];
  onLogin: (u: User) => void;
  onSetUserPassword: (userId: string, passwordHash: string) => void;
};

const Login: React.FC<Props> = ({ users, onLogin, onSetUserPassword }) => {
  const [selected, setSelected] = useState<User | null>(null);
  const [mode, setMode] = useState<'choose' | 'enter' | 'create' | 'change'>('choose');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');
  const [loginInput, setLoginInput] = useState('');

  const resetFields = () => {
    setPass('');
    setPass2('');
    setError('');
  };

  const findUserByInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    return (
      users.find(
        u =>
          (u.username && u.username.toLowerCase() === trimmed.toLowerCase()) ||
          u.name.toLowerCase() === trimmed.toLowerCase() ||
          u.email.toLowerCase() === trimmed.toLowerCase()
      ) || null
    );
  };

  const handleChoose = (u: User) => {
    setSelected(u);
    resetFields();

    if (!u.passwordHash) {
      setMode('create');
    } else if (u.mustChangePassword) {
      setMode('enter'); // primeiro valida senha atual
    } else {
      setMode('enter');
    }
  };

  const handleCreate = async () => {
    setError('');

    if (!pass || pass.length < 4) {
      setError('Senha deve ter ao menos 4 caracteres');
      return;
    }

    if (pass !== pass2) {
      setError('Senhas não coincidem');
      return;
    }

    const hash = await hashPassword(pass);
    onSetUserPassword(selected!.id, hash);
    onLogin({ ...selected!, passwordHash: hash, mustChangePassword: false });
  };

  const handleEnter = async () => {
    setError('');

    if (!selected?.passwordHash) return;

    const ok = await verifyPassword(pass, selected.passwordHash);

    if (!ok) {
      setError('Senha incorreta');
      return;
    }

    // Se precisa trocar senha
    if (selected.mustChangePassword) {
      setMode('change');
      resetFields();
      return;
    }

    onLogin(selected);
  };

  const handleChangePassword = async () => {
    setError('');

    if (!pass || pass.length < 4) {
      setError('Nova senha deve ter ao menos 4 caracteres');
      return;
    }

    if (pass !== pass2) {
      setError('Senhas não coincidem');
      return;
    }

    const hash = await hashPassword(pass);
    onSetUserPassword(selected!.id, hash);

    onLogin({
      ...selected!,
      passwordHash: hash,
      mustChangePassword: false
    });
  };

  const attemptSelectFromInput = () => {
    setError('');

    const u = findUserByInput(loginInput);

    if (!u) {
      setError('Usuário não encontrado');
      return;
    }

    if (u.active === false) {
      setError('Usuário Inativo - Contacte o administrador do sistema');
      return;
    }

    handleChoose(u);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        
        {mode === 'choose' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Entrar</h2>
            <p className="text-sm text-slate-500 mb-6">
              Digite username, nome ou e-mail
            </p>

            <div className="space-y-3">
              <input
                list="users-list"
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                placeholder="username / nome / email"
                className="w-full px-3 py-2 border rounded"
              />

              <datalist id="users-list">
                {users.map(u => (
                  <option key={u.id} value={u.username || u.name}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </datalist>

              <div className="flex gap-2">
                <button
                  onClick={attemptSelectFromInput}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Entrar
                </button>

                <button
                  onClick={() => {
                    setLoginInput('');
                    setError('');
                  }}
                  className="px-3 py-2 border rounded"
                >
                  Limpar
                </button>
              </div>

              {error && (
                <div className="text-rose-600 text-sm">{error}</div>
              )}
            </div>
          </>
        )}

        {mode === 'create' && selected && (
          <>
            <h2 className="text-2xl font-bold mb-4">Criar Senha</h2>
            <p className="text-sm text-slate-500 mb-4">
              Usuário {selected.name} não possui senha. Crie uma para continuar.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Senha"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              <input
                type="password"
                placeholder="Repita a senha"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              {error && (
                <div className="text-rose-600 text-sm">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setMode('choose')}
                  className="px-3 py-2 border rounded"
                >
                  Voltar
                </button>

                <button
                  onClick={handleCreate}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Criar e Entrar
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'enter' && selected && (
          <>
            <h2 className="text-2xl font-bold mb-4">Senha</h2>
            <p className="text-sm text-slate-500 mb-4">
              Digite a senha do usuário {selected.name}
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Senha"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              {error && (
                <div className="text-rose-600 text-sm">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setMode('choose')}
                  className="px-3 py-2 border rounded"
                >
                  Voltar
                </button>

                <button
                  onClick={handleEnter}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Entrar
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'change' && selected && (
          <>
            <h2 className="text-2xl font-bold mb-4">Alterar Senha</h2>
            <p className="text-sm text-slate-500 mb-4">
              Você deve definir uma nova senha para continuar.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Nova senha"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              <input
                type="password"
                placeholder="Repita a nova senha"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              {error && (
                <div className="text-rose-600 text-sm">{error}</div>
              )}

              <button
                onClick={handleChangePassword}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded"
              >
                Salvar Nova Senha
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;