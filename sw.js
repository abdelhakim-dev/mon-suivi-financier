// Service Worker pour Mon Suivi Financier
const CACHE_NAME = 'mon-suivi-financier-v2';
const urlsToCache = [
    '/mon-suivi-financier/',
    '/mon-suivi-financier/index.html',
    '/mon-suivi-financier/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Installation du Service Worker
self.addEventListener('install', function(event) {
    console.log('Service Worker: Installation en cours...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: Mise en cache des fichiers');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.log('Service Worker: Installation terminée');
                return self.skipWaiting();
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activation en cours...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('Service Worker: Activation terminée');
            return self.clients.claim();
        })
    );
});

// Interception des requêtes - Stratégie Cache First
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(cachedResponse) {
                // Retourner la version en cache si elle existe
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Sinon, aller chercher sur le réseau
                return fetch(event.request)
                    .then(function(response) {
                        // Vérifier si la réponse est valide pour la mise en cache
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cloner la réponse pour la mettre en cache
                        var responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(function() {
                        // Si le réseau échoue, retourner la page d'accueil pour les navigations
                        if (event.request.mode === 'navigate') {
                            return caches.match('/mon-suivi-financier/');
                        }
                        // Pour les autres requêtes, retourner une erreur
                        return new Response('Mode hors-ligne - Contenu non disponible', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Gestion des messages
self.addEventListener('message', function(event) {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
