// sw.js - Darsh Stock Service Worker (PWA)
const CACHE_NAME = 'darsh-stock-v1';
const urlsToCache = [
  '/my-website/',
  '/my-website/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية مسبقاً
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ تم فتح الكاش وتخزين الملفات');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ فشل في تثبيت الـ SW:', err))
  );
  // تفعيل الـ SW فوراً دون انتظار إغلاق المتصفح
  self.skipWaiting();
});

// استراتيجية التخزين المؤقت: Cache First ثم الرجوع للشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان الملف موجوداً في الكاش، أرجع نسخة الكاش
        if (response) {
          return response;
        }
        // وإلا، قم بجلب الملف من الشبكة ثم خزنه مؤقتاً للاستخدام القادم
        return fetch(event.request).then(networkResponse => {
          // لا نخزن سوى الاستجابات الناجحة (status 200) من نفس النطاق أو CDNs آمنة
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // في حالة عدم وجود اتصال بالإنترنت ولا يوجد ملف في الكاش
          // يمكن إرجاع صفحة offline مخصصة (اختياري)
          return new Response('⚠️ لا يوجد اتصال بالإنترنت والصفحة غير مخزنة مسبقاً');
        });
      })
  );
});

// تفعيل وتنظيف الكاش القديم عند تحديث الـ SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log(`🗑️ حذف الكاش القديم: ${key}`);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log(`🎉 Service Worker مفعل وجاهز (${CACHE_NAME})`);
    })
  );
  // السيطرة على جميع الصفحات المفتوحة فوراً
  self.clients.claim();
});