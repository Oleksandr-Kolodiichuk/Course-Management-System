const addResourcesToCache = async (resources) =>
{
    const cache = await caches.open("my-site-cache-v1");
    await cache.addAll(resources);
};
  
self.addEventListener("install", (event) => {
    event.waitUntil(
    addResourcesToCache([
        "/", //коренева URL сайту (для кешування головної сторінки сайту)
        "/index.html",
        "/styles.css",
        "/scripts.js",
        "/images/icon.png",
        "/images/ava.png",
        "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
    ]),
    );
});
  
self.addEventListener("fetch", (event) => { //при кожному запиті на ресурс
    event.respondWith((async () =>
    {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse)
        {
            return cachedResponse;
        }
        try
        {
            const response = await fetch(event.request);
            const cache = await caches.open("my-site-cache-v1");
            cache.put(event.request, response.clone());
            return response;
        }
        catch (error)
        {
            console.error(`Fetch failed with ${error}`);
        }
    })()
    );
});