var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// Based on Bing Speech API documentation
// https://www.microsoft.com/cognitive-services/en-us/Speech-api/documentation/API-Reference-REST/BingVoiceOutput 
var BingTTS;
(function (BingTTS) {
    (function (OutputFormat) {
        /**
        * Warning: not supported by Web Audio
        */
        OutputFormat[OutputFormat["Raw8khz8bit"] = 0] = "Raw8khz8bit";
        /**
        * Warning: not supported by Web Audio
        */
        OutputFormat[OutputFormat["Raw16khz16bit"] = 1] = "Raw16khz16bit";
        OutputFormat[OutputFormat["Riff8khz8bit"] = 2] = "Riff8khz8bit";
        /**
        * Default value
        */
        OutputFormat[OutputFormat["Riff16khz16bit"] = 3] = "Riff16khz16bit";
    })(BingTTS.OutputFormat || (BingTTS.OutputFormat = {}));
    var OutputFormat = BingTTS.OutputFormat;
    ;
    (function (SupportedLocales) {
        SupportedLocales[SupportedLocales["arEG_Female"] = 0] = "arEG_Female";
        SupportedLocales[SupportedLocales["deDE_Female"] = 1] = "deDE_Female";
        SupportedLocales[SupportedLocales["deDE_Male"] = 2] = "deDE_Male";
        SupportedLocales[SupportedLocales["enAU_Female"] = 3] = "enAU_Female";
        SupportedLocales[SupportedLocales["enCA_Female"] = 4] = "enCA_Female";
        SupportedLocales[SupportedLocales["enGB_Female"] = 5] = "enGB_Female";
        SupportedLocales[SupportedLocales["enGB_Male"] = 6] = "enGB_Male";
        SupportedLocales[SupportedLocales["enIN_Male"] = 7] = "enIN_Male";
        SupportedLocales[SupportedLocales["enUS_Female"] = 8] = "enUS_Female";
        SupportedLocales[SupportedLocales["enUS_Male"] = 9] = "enUS_Male";
        SupportedLocales[SupportedLocales["esES_Female"] = 10] = "esES_Female";
        SupportedLocales[SupportedLocales["esES_Male"] = 11] = "esES_Male";
        SupportedLocales[SupportedLocales["esMX_Male"] = 12] = "esMX_Male";
        SupportedLocales[SupportedLocales["frCA_Female"] = 13] = "frCA_Female";
        SupportedLocales[SupportedLocales["frFR_Female"] = 14] = "frFR_Female";
        SupportedLocales[SupportedLocales["frFR_Male"] = 15] = "frFR_Male";
        SupportedLocales[SupportedLocales["itIT_Male"] = 16] = "itIT_Male";
        SupportedLocales[SupportedLocales["jpJP_Female"] = 17] = "jpJP_Female";
        SupportedLocales[SupportedLocales["jpJP_Male"] = 18] = "jpJP_Male";
        SupportedLocales[SupportedLocales["ptBR_Male"] = 19] = "ptBR_Male";
        SupportedLocales[SupportedLocales["ruRU_Female"] = 20] = "ruRU_Female";
        SupportedLocales[SupportedLocales["ruRU_Male"] = 21] = "ruRU_Male";
        SupportedLocales[SupportedLocales["zhCN_Female"] = 22] = "zhCN_Female";
        SupportedLocales[SupportedLocales["zhCN_Female2"] = 23] = "zhCN_Female2";
        SupportedLocales[SupportedLocales["zhCN_Male"] = 24] = "zhCN_Male";
        SupportedLocales[SupportedLocales["zhHK_Female"] = 25] = "zhHK_Female";
        SupportedLocales[SupportedLocales["zhHK_Male"] = 26] = "zhHK_Male";
        SupportedLocales[SupportedLocales["zhTW_Female"] = 27] = "zhTW_Female";
        SupportedLocales[SupportedLocales["zhTW_Male"] = 28] = "zhTW_Male";
    })(BingTTS.SupportedLocales || (BingTTS.SupportedLocales = {}));
    var SupportedLocales = BingTTS.SupportedLocales;
    class Client {
        /**
        * @param apiKey should be your Bing Speech API key
        * Note: The way to get api key:
        * https://www.microsoft.com/cognitive-services/en-us/subscriptions?productId=/products/Bing.Speech.Preview
        * Paid: https://portal.azure.com/#create/Microsoft.CognitiveServices/apitype/Bing.Speech/pricingtier/S0
        */
        constructor(apiKey, locale = SupportedLocales.enUS_Male) {
            this._canUseWebAudio = false;
            this._waitingQueue = [];
            this._waitingQueueIndex = [];
            this._nbWaitingItems = 0;
            this._requestsInProgress = 0;
            // By default, doing multiple XHR in parallel to download Bing Speech generated wav
            // Set to false to serialize requests
            this.multipleXHR = true;
            if (!apiKey) {
                throw "Please provide a valid Bing Speech API key";
            }
            this._apiKey = apiKey;
            this._globalLocale = locale;
            try {
                if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    this._audioContext = new AudioContext();
                    this._canUseWebAudio = true;
                    // iOS requires a touch interaction before unlocking its web audio stack
                    if (/iPad|iPhone|iPod/.test(navigator.platform)) {
                        this._unlockiOSaudio();
                    }
                }
            }
            catch (e) {
                console.error("Cannot initialize Web Audio Context.");
            }
        }
        _unlockiOSaudio() {
            var unlockaudio = () => {
                var buffer = this._audioContext.createBuffer(1, 1, 22050);
                var source = this._audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this._audioContext.destination);
                source.start(0);
                setTimeout(() => {
                    if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                        window.removeEventListener('touchend', unlockaudio, false);
                    }
                }, 0);
            };
            window.addEventListener('touchend', unlockaudio, false);
        }
        _makeHttpRequest(actionType, url, isArrayBuffer = false, optionalHeaders, dataToSend) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    if (isArrayBuffer) {
                        xhr.responseType = 'arraybuffer';
                    }
                    xhr.onreadystatechange = function (event) {
                        if (xhr.readyState !== 4)
                            return;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            if (!isArrayBuffer) {
                                resolve(xhr.responseText);
                            }
                            else {
                                resolve(xhr.response);
                            }
                        }
                        else {
                            reject(xhr.statusText); //Error
                        }
                    };
                    xhr.open(actionType, url, true);
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    xhr.setRequestHeader("If-Modified-Since", "Sun, 6 Jun 1980 00:00:00 GMT");
                    if (optionalHeaders) {
                        optionalHeaders.forEach((header) => {
                            xhr.setRequestHeader(header.name, header.value);
                        });
                    }
                    if (dataToSend) {
                        xhr.send(dataToSend);
                    }
                    else {
                        xhr.send();
                    }
                });
            });
        }
        synthesize(text, locale, callback, outputFormat = OutputFormat.Riff16khz16bit) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._canUseWebAudio) {
                    console.error("You need Web Audio to use this API.");
                    return;
                }
                // Let's use that as a key to retrieve our item after the XHR callback
                let speechItemIndex = this._nbWaitingItems;
                this._nbWaitingItems++;
                var newSpeechItem = { isReadyToPlay: false, data: null, index: speechItemIndex, text: text, locale: locale, outputFormat: outputFormat, callback: callback };
                this._waitingQueue.push(newSpeechItem);
                this._waitingQueueIndex.push(speechItemIndex);
                if (this.multipleXHR || this._requestsInProgress == 0) {
                    this._getBingSpeechData(text, locale, outputFormat, speechItemIndex);
                }
            });
        }
        _getBingSpeechData(text, locale, outputFormat, speechItemIndex) {
            return __awaiter(this, void 0, void 0, function* () {
                this._requestsInProgress++;
                // ---- This whole code block is async ------
                var optionalHeaders = [{ name: "Ocp-Apim-Subscription-Key", value: this._apiKey },
                    // required for Firefox otherwise a CORS error is raised
                    { name: "Access-Control-Allow-Origin", value: "*" }];
                try {
                    var resultsText = yield this._makeHttpRequest("POST", "https://api.cognitive.microsoft.com/sts/v1.0/issueToken", false, optionalHeaders);
                }
                catch (ex) {
                    console.error("Error issuing token. Did you provide a valid Bing Speech API key?");
                }
                var outputFormatValue = this._getFormatValue(outputFormat);
                optionalHeaders = [{ name: "Content-type", value: 'application/ssml+xml' },
                    { name: "X-Microsoft-OutputFormat", value: outputFormatValue },
                    { name: "Authorization", value: resultsText },
                    { name: "X-Search-AppIde", value: '07D3234E49CE426DAA29772419F436CA' },
                    { name: "X-Search-ClientID", value: '1ECFAE91408841A480F00935DC390960' },
                    { name: "Ocp-Apim-Subscription-Key", value: this._apiKey }];
                var SSML = this.makeSSML(text, locale);
                try {
                    var blobReponse = yield this._makeHttpRequest("POST", "https://speech.platform.bing.com/synthesize", true, optionalHeaders, SSML);
                }
                catch (ex) {
                    console.warn("Error while calling Bing Speech API. Ignoring this item: '" + text + "'");
                }
                this._requestsInProgress--;
                // ---------------------------------------------
                // In case of multiple XHR, we can reach this line by anytime
                // that's why we kept a copy of the speech item index to remember its order in the queue
                let indexInQueue = this._waitingQueueIndex.indexOf(speechItemIndex);
                let nextIndex = indexInQueue + 1;
                // If we had data back, it will be added to the queue to be decoded & play later
                if (blobReponse) {
                    this._waitingQueue[indexInQueue].data = blobReponse;
                    this._waitingQueue[indexInQueue].isReadyToPlay = true;
                }
                else {
                    this._waitingQueue.splice(indexInQueue, 1);
                    this._waitingQueueIndex.splice(indexInQueue, 1);
                    nextIndex--;
                }
                // If mono-XHR, let's at least launch the next XHR in background while playing this text
                if (!this.multipleXHR && (nextIndex < this._waitingQueue.length)) {
                    this._getBingSpeechData(this._waitingQueue[nextIndex].text, this._waitingQueue[nextIndex].locale, this._waitingQueue[nextIndex].outputFormat, this._waitingQueue[nextIndex].index);
                }
                if (!this._playing) {
                    this._play();
                }
            });
        }
        _play() {
            // Checking the next speech item to handle
            var speechItem = this._waitingQueue[0];
            if (!speechItem) {
                return;
            }
            // If it's not ready yet, let's wait for 100ms more
            if (!speechItem.isReadyToPlay) {
                window.setTimeout(() => {
                    this._play();
                }, 100);
                return;
            }
            // If it's ready to be decoded & played
            if (!this._playing) {
                this._playing = true;
                this._audioContext.decodeAudioData(speechItem.data, (buffer) => {
                    var source = this._audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this._audioContext.destination);
                    source.start(0);
                    source.onended = (evt) => {
                        this._playing = false;
                        this._waitingQueue.splice(0, 1);
                        this._waitingQueueIndex.splice(0, 1);
                        if (speechItem.callback) {
                            speechItem.callback();
                        }
                        if (this._waitingQueue.length > 0) {
                            this._play();
                        }
                        else {
                            this._nbWaitingItems = 0;
                        }
                    };
                });
            }
        }
        _getFormatValue(outputFormat) {
            var outputFormatValue;
            switch (outputFormat) {
                case OutputFormat.Raw16khz16bit:
                    outputFormatValue = "raw-16khz-16bit-mono-pcm";
                    break;
                case OutputFormat.Raw8khz8bit:
                    outputFormatValue = "raw-8khz-8bit-mono-mulaw";
                    break;
                case OutputFormat.Riff16khz16bit:
                    outputFormatValue = "riff-16khz-16bit-mono-pcm";
                    break;
                case OutputFormat.Riff8khz8bit:
                    outputFormatValue = "riff-8khz-8bit-mono-mulaw";
                    break;
                default:
                    outputFormatValue = "riff-16khz-16bit-mono-pcm";
            }
            return outputFormatValue;
        }
        makeSSML(text, localeAsked) {
            var locale;
            var gender;
            var supportedLocaleValue;
            var SSML = "<speak version='1.0' xml:lang=";
            if (!localeAsked) {
                localeAsked = this._globalLocale;
            }
            switch (localeAsked) {
                case SupportedLocales.arEG_Female:
                    locale = "'ar-eg'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)";
                    break;
                case SupportedLocales.deDE_Female:
                    locale = "'de-de'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";
                    break;
                case SupportedLocales.deDE_Male:
                    locale = "'de-de'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo)";
                    break;
                case SupportedLocales.enAU_Female:
                    locale = "'en-au'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-AU, Catherine)";
                    break;
                case SupportedLocales.enCA_Female:
                    locale = "'en-ca'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-CA, Linda)";
                    break;
                case SupportedLocales.enGB_Female:
                    locale = "'en-gb'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-GB, Susan, Apollo)";
                    break;
                case SupportedLocales.enGB_Male:
                    locale = "'en-gb'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-GB, George, Apollo)";
                    break;
                case SupportedLocales.enIN_Male:
                    locale = "'en-in'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-IN, Ravi, Apollo)";
                    break;
                case SupportedLocales.enUS_Female:
                    locale = "'en-us'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)";
                    break;
                case SupportedLocales.enUS_Male:
                    locale = "'en-us'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)";
                    break;
                case SupportedLocales.esES_Female:
                    locale = "'es-es'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-ES, Laura, Apollo)";
                    break;
                case SupportedLocales.esES_Male:
                    locale = "'es-es'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-ES, Pablo, Apollo)";
                    break;
                case SupportedLocales.esMX_Male:
                    locale = "'es-mx'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-MX, Raul, Apollo)";
                    break;
                case SupportedLocales.frCA_Female:
                    locale = "'fr-ca'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-CA, Caroline)";
                    break;
                case SupportedLocales.frFR_Female:
                    locale = "'fr-fr'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-FR, Julie, Apollo)";
                    break;
                case SupportedLocales.frFR_Male:
                    locale = "'fr-fr'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-FR, Paul, Apollo)";
                    break;
                case SupportedLocales.itIT_Male:
                    locale = "'it-it'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (it-IT, Cosimo, Apollo)";
                    break;
                case SupportedLocales.jpJP_Female:
                    locale = "'jp-jp'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ja-JP, Ayumi, Apollo)";
                    break;
                case SupportedLocales.jpJP_Male:
                    locale = "'jp-jp'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ja-JP, Ichiro, Apollo)";
                    break;
                case SupportedLocales.ptBR_Male:
                    locale = "'pt-br'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel, Apollo)";
                    break;
                case SupportedLocales.ruRU_Female:
                    locale = "'ru-ru'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ru-RU, Irina, Apollo)";
                    break;
                case SupportedLocales.ruRU_Male:
                    locale = "'ru-ru'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ru-RU, Pavel, Apollo)";
                    break;
                case SupportedLocales.zhCN_Female:
                    locale = "'zh-cn'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)";
                    break;
                case SupportedLocales.zhCN_Female2:
                    locale = "'zh-cn'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, Yaoyao, Apollo)";
                    break;
                case SupportedLocales.zhCN_Male:
                    locale = "'zh-cn'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, Kangkang, Apollo)";
                    break;
                case SupportedLocales.zhHK_Female:
                    locale = "'zh-hk'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-HK, Tracy, Apollo)";
                    break;
                case SupportedLocales.zhHK_Male:
                    locale = "'zh-hk'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-HK, Danny, Apollo)";
                    break;
                case SupportedLocales.zhTW_Female:
                    locale = "'zh-tw'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-TW, Yating, Apollo)";
                    break;
                case SupportedLocales.zhTW_Male:
                    locale = "'zh-tw'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-TW, Zhiwei, Apollo)";
                    break;
                default:
                    locale = "'en-us'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)";
            }
            SSML += locale + "><voice xml:lang=" + locale + " xml:gender=" + gender + " name='" + supportedLocaleValue + "'>" + `${text.encodeHTML()}` + "</voice></speak>";
            return SSML;
        }
    }
    BingTTS.Client = Client;
})(BingTTS || (BingTTS = {}));
if (!String.prototype.encodeHTML) {
    String.prototype.encodeHTML = function () {
        return this.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
}
//# sourceMappingURL=BingTTSClient.js.map