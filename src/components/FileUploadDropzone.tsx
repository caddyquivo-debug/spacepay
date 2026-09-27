import React, { useState, useRef } from 'react';
import { api } from '../services/api.ts';
import {
  UploadCloud,
  FileText,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Link,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface FileUploadDropzoneProps {
  productType: 'ebook' | 'video';
  fileName?: string;
  fileSizeFormatted?: string;
  fileUrl?: string;
  onFileUploaded: (result: {
    fileName: string;
    fileSize: number;
    fileSizeFormatted: string;
    fileUrl: string;
  }) => void;
  onFileRemoved: () => void;
  externalUrl?: string;
  onExternalUrlChange?: (url: string) => void;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  productType,
  fileName,
  fileSizeFormatted,
  fileUrl,
  onFileUploaded,
  onFileRemoved,
  externalUrl,
  onExternalUrlChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showExternalInput, setShowExternalInput] = useState(Boolean(externalUrl && !fileName));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEbook = productType === 'ebook';
  const acceptedTypes = isEbook ? '.pdf,application/pdf' : '.mp4,.webm,.mov,video/*';
  const labelType = isEbook ? 'eBook (PDF)' : 'Vídeo de Dicas (MP4/WebM)';
  const maxSizeMB = isEbook ? 50 : 100;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // File validation
    if (isEbook && !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecione um arquivo em formato PDF para o eBook.');
      return;
    }

    if (!isEbook && !file.type.includes('video') && !file.name.toLowerCase().match(/\.(mp4|webm|mov|mkv)$/i)) {
      setError('Por favor selecione um arquivo de vídeo válido (.mp4, .webm, .mov).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o limite máximo permitido de ${maxSizeMB} MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(10);

    try {
      const res = await api.uploadFile(file, (progress: number) => {
        setUploadProgress(progress);
      });

      onFileUploaded({
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileSizeFormatted: res.fileSizeFormatted,
        fileUrl: res.fileUrl || res.publicUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Erro durante o upload do arquivo.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          {isEbook ? <FileText className="w-4 h-4 text-emerald-600" /> : <Video className="w-4 h-4 text-indigo-600" />}
          <span>Upload do Arquivo do {labelType} *</span>
        </label>

        <button
          type="button"
          onClick={() => setShowExternalInput(!showExternalInput)}
          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer underline flex items-center gap-1"
        >
          <Link className="w-3 h-3" />
          {showExternalInput ? 'Voltar para upload de arquivo' : 'Ou inserir link externo'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded File Card State */}
      {fileName && !uploading && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {fileName}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {fileSizeFormatted || 'Pronto'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Download automático habilitado para o cliente após pagamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Substituir arquivo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onFileRemoved}
              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              title="Remover arquivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload in Progress */}
      {uploading && (
        <div className="p-5 bg-white border border-emerald-300 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Fazendo upload do arquivo para o servidor SpacePay...
            </span>
            <span className="font-bold text-emerald-700 tabular-nums">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-200 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Por favor, aguarde enquanto o arquivo é processado e protegido no servidor.
          </p>
        </div>
      )}

      {/* Dropzone Box */}
      {!fileName && !uploading && !showExternalInput && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs text-emerald-600">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h5 className="text-xs font-bold text-slate-900 mb-1">
            Clique para selecionar ou arraste o arquivo do seu {labelType}
          </h5>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {isEbook
              ? 'Formato PDF até 50 MB. Este arquivo será entregue e baixado automaticamente pelo comprador logo após pagar via M-Pesa / mCash.'
              : 'Formato MP4, WebM ou MOV até 100 MB. Liberado para download e reprodução imediata do cliente.'}
          </p>

          <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 shadow-2xs">
            Formatos aceitos: {isEbook ? '.PDF' : '.MP4, .WEBM, .MOV'}
          </span>
        </div>
      )}

      {/* External Link Input Fallback */}
      {showExternalInput && !fileName && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <label className="text-[11px] font-semibold text-slate-700 block">
            Link Externo para Download / Acesso Direto (Google Drive, Dropbox, YouTube, etc.):
          </label>
          <input
            type="url"
            value={externalUrl || ''}
            onChange={(e) => onExternalUrlChange && onExternalUrlChange(e.target.value)}
            placeholder={isEbook ? 'Ex: https://drive.google.com/file/d/.../view' : 'Ex: https://.../video.mp4'}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
          <p className="text-[10px] text-slate-500">
            Dica: Recomendamos o upload direto do arquivo no botão acima para permitir que o cliente baixe automaticamente sem sair do SpacePay.
          </p>
        </div>
      )}
    </div>
  );
};
