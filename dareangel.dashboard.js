// TODO: generate those free keys on the web
const COMPUTERVISIONKEY = "";
const BINGSPEECHKEY = "";
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();
var DareAngel;
(function (DareAngel) {
    class Dashboard {
        constructor(targetDiv) {
            this._imagesList = [];
            this._tabIndex = 2;
            this._canUseWebAudio = false;
            this._useBingTTS = false;
            this._targetDiv = targetDiv;
            this._bingTTSclient = new BingTTS.Client(BINGSPEECHKEY);
            var BingTTSChk = document.getElementById("useBingTTS");
            BingTTSChk.addEventListener("change", () => {
                this._useBingTTS = BingTTSChk.checked;
            });
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                browser.tabs.sendMessage(tabs[0].id, { command: "requestImages" }, (response) => {
                    this._imagesList = JSON.parse(response);
                    this._imagesList.forEach((element) => {
                        var newImageHTMLElement = document.createElement("img");
                        newImageHTMLElement.src = element.url;
                        newImageHTMLElement.alt = element.alt;
                        newImageHTMLElement.tabIndex = this._tabIndex;
                        this._tabIndex++;
                        newImageHTMLElement.addEventListener("focus", (event) => {
                            if (COMPUTERVISIONKEY !== "") {
                                this.analyzeThisImage(event.target.src);
                            }
                            else {
                                var warningMsg = document.createElement("div");
                                warningMsg.innerHTML = "<h2>Please generate a Computer Vision key in the other tab.</h2>";
                                this._targetDiv.insertBefore(warningMsg, this._targetDiv.firstChild);
                                browser.tabs.create({ active: false, url: "https://www.microsoft.com/cognitive-services/en-US/sign-up?ReturnUrl=/cognitive-services/en-us/subscriptions?productId=%2fproducts%2f54d873dd5eefd00dc474a0f4" });
                            }
                        });
                        this._targetDiv.appendChild(newImageHTMLElement);
                    });
                });
            });
        }
        analyzeThisImage(url) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var response = document.querySelector('#response');
                    var reponse = JSON.parse(xhr.response);
                    var resultToSpeak = `With a confidence of ${Math.round(reponse.description.captions[0].confidence * 100)}%, I think it's ${reponse.description.captions[0].text}`;
                    console.log(resultToSpeak);
                    if (!this._useBingTTS || BINGSPEECHKEY === "") {
                        var synUtterance = new SpeechSynthesisUtterance();
                        synUtterance.text = resultToSpeak;
                        window.speechSynthesis.speak(synUtterance);
                    }
                    else {
                        this._bingTTSclient.synthesize(resultToSpeak);
                    }
                }
            };
            xhr.onerror = (evt) => {
                console.log(evt);
            };
            try {
                xhr.open('POST', 'https://api.projectoxford.ai/vision/v1.0/describe');
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Ocp-Apim-Subscription-Key", COMPUTERVISIONKEY);
                var requestObject = { "url": url };
                xhr.send(JSON.stringify(requestObject));
            }
            catch (ex) {
                console.log(ex);
            }
        }
    }
    DareAngel.Dashboard = Dashboard;
})(DareAngel || (DareAngel = {}));
//# sourceMappingURL=dareangel.dashboard.js.map