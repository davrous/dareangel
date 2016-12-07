# Dare Angel
Dare Angel is a **POC extension** aiming to provide more accessibility on images of a web page.

It will simply extract the images from a specific web page (the active tab) and display the thumbnails into a list. When you’ll click on one of them, it will query the **Computer Vision API** to get some text describing the image and will use wither the **Web Speech API** or **Bing Speech API** to share it with the listener. 

This video is demonstrating it into Edge, Chrome, Firefox, Opera & Brave:

[![Dare Angel Video](https://david.blob.core.windows.net/videos/dareangelvideothumb.jpg)](https://www.youtube.com/watch?v=gQ6_CZlIKyo "Dare Angel Video")

In this sample, we're using those services:
- The **Computer Vision API** from **Microsoft Cognitive Services** which are **free to use** (with a quota). You’ll need to generate a free key there to make the code working and replace the TODO section in the code with it to make this extension working on your machine. To have an idea of what this API could do, play with it: https://www.captionbot.ai 
- The **Bing Text to Speech API** from **Microsoft Cognitive Services** which are also **free to use** (with a quota also). You’ll need again to generate a free key to use this part. We’ll use also a small library I’ve written recently to call those API from JavaScript: https://github.com/davrous/BingTTSClientJSLib. If you’re not providing a Bing key, we will always fallback to the Web Speech API.

[Check out the associated article](https://www.davrous.com/2016/12/07/creating-an-extension-for-all-browsers-edge-chrome-firefox-opera-brave/ "Creating an extension for all browsers: Edge, Chrome, Firefox, Opera & Brave")
