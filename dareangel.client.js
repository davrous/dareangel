window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();
console.log("Dare Angel content script started");
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command == "requestImages") {
        var images = document.getElementsByTagName('img');
        var imagesList = [];
        for (var i = 0; i < images.length; i++) {
            if ((images[i].src.toLowerCase().endsWith(".jpg") || images[i].src.toLowerCase().endsWith(".png"))
                && (images[i].width > 64 && images[i].height > 64)) {
                imagesList.push({ url: images[i].src, alt: images[i].alt });
            }
        }
        sendResponse(JSON.stringify(imagesList));
    }
});
//# sourceMappingURL=dareangel.client.js.map