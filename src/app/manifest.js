export default function manifest() {
  return {
    name: 'Worship Team Hub',
    short_name: 'Escalas',
    description: 'Aplicacao para consulta e gestao de escalas.',
    id: '/',
    start_url: '/',
    scope: '/',
    display_override: ['window-controls-overlay', 'standalone'],
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
