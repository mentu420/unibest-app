interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_PORT: string
  readonly VITE_UNI_APPID: string
  readonly VITE_WX_APPID: string
  readonly VITE_APP_PUBLIC_BASE: string
  readonly VITE_SERVER_BASEURL: string
  readonly VITE_UPLOAD_BASEURL: string
  readonly VITE_APP_PROXY: string
  readonly VITE_APP_PROXY_PREFIX: string
  readonly VITE_APP_AUTH_SS0: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
