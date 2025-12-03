import React, { useState } from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';

const Security2FASection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleEnable2FA = async () => {
    setLoading(true);
    setMessage('');
    try {
      const resp = await fetch('/api/auth/2fa/enroll', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const json = await resp.json();
      if (!resp.ok || json.success === false) {
        setMessage(json.error || 'Falha ao habilitar 2FA');
        return;
      }
      setQr(json.qr as string);
      setSecret(json.secret as string);
      setMessage('2FA habilitado. Escaneie o QR no seu aplicativo autenticador.');
    } catch {
      setMessage('Erro interno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <span className="text-sm text-gray-700">Habilite verificação em duas etapas para sua conta administrativa.</span>
      </div>
      <button
        onClick={handleEnable2FA}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <QrCode className="w-4 h-4 mr-2" />
        {loading ? 'Gerando...' : 'Habilitar 2FA'}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      {qr && (
        <div className="mt-4">
          <img src={qr} alt="QR 2FA" className="w-48 h-48 border rounded" />
          <p className="text-xs text-gray-500 mt-2">Segredo: {secret}</p>
        </div>
      )}
    </div>
  );
};

export default Security2FASection;

