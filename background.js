// Background service worker
console.log("Background service worker loaded.");

let isRecorderWindowActive = false;

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'recorder.html',
    type: 'popup',
    width: 380,
    height: 620,
    focused: true
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'download-recording') {
    fetch(msg.data)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const filename = msg.filename;
        return chrome.downloads.download({ url, filename, saveAs: false });
      })
      .then(downloadId => sendResponse({ ok: true, downloadId }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.type === 'recorder-status') {
    isRecorderWindowActive = msg.isRecording;
  }

  if (msg.type === 'get-recording-status') {
    sendResponse({ isRecording: isRecorderWindowActive });
  }

  return false;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'stop-recording') {
    chrome.runtime.sendMessage({ type: 'command-stop' }).catch(() => {});
  }
});