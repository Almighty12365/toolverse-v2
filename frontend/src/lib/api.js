import axios from 'axios';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiPost = async (path, formData, opts={}) => {
  return axios.post(`${API}${path}`, formData, {
    responseType: opts.json ? 'json' : 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: opts.onUploadProgress,
  });
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); window.URL.revokeObjectURL(url);
};
