// Definición de recursos para Cache Only (App Shell)
const APP_SHELL_ASSETS = [
    '/',
    '/index.html',
    '/calendar.html',
    '/form.html',
    '/about.html',
    '/style.css',
    '/register.js'
];

// Definición de recursos para Cache First, Network Fallback (Recursos dinámicos)
const DYNAMIC_ASSET_URLS = [
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css'
];


const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Evento install: Precaché de recursos del App Shell
self.addEventListener('install', event => {
    console.log('Service Worker: Instalado');
    
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then(cache => {
                console.log('Service Worker: Cacheando recursos del App Shell');
                return cache.addAll(APP_SHELL_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Evento activate: Limpieza de cachés antiguos
self.addEventListener('activate', event => {
    console.log('Service Worker: Activado');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== APP_SHELL_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Eliminando caché antiguo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Evento fetch: Implementación de estrategias mixtas
self.addEventListener('fetch', event => {
    const request = event.request;
    
    
    if (APP_SHELL_ASSETS.some(asset => 
        request.url.endsWith(asset) || 
        request.url === self.location.origin + '/' && asset === '/'
    )) {
        event.respondWith(
            caches.match(request)
        );
    }
    
    else if (DYNAMIC_ASSET_URLS.some(url => request.url === url)) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.match(request).then(response => {
                    
                    if (response) {
                        return response;
                    }
                    
                    
                    return fetch(request).then(networkResponse => {
                        
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    }).catch(error => {
                        console.log('Error en la petición de red:', error);
                        
                        return new Response('Recurso no disponible offline', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
                });
            })
        );
    }
});