import { useStore } from 'src/store';
import { selectPdfReaderPath } from 'src/store/settings/settingsSelectors';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';

interface OpenFileParams {
  path: string;
  program_path?: string;
  page?: number;
}

interface OpenFileResult {
  success: boolean;
  path: string;
}

export const useInvokeOpenFile = () => {
  const programPath = useStore(selectPdfReaderPath);

  const invokeOpenFile = async (path: string, page?: number) => {
    const params: OpenFileParams = {
      path,
      ...(programPath ? { program_path: programPath } : {}),
    };
    
    if (page !== undefined) {
      params.page = page;
    }

    const result = await invoke('open_file', { params });

    if (!(result as OpenFileResult).success) {
      toast.error(
        `Не удалось открыть приложение ${programPath} Открываю в ${
          (result as OpenFileResult).path === 'explorer'
            ? 'приложении по умолчанию'
            : (result as OpenFileResult).path
        }...`
      );
    }
    
    return result;
  };

  return invokeOpenFile;
};
