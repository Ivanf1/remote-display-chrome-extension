const wsUrl = "ws://192.168.0.7/text";
let websocket;
let activeAudioTabInfo = {
  id: null,
  title: null,
  url: null,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "start-ws" /*&& !websocket*/) {
    // wsConnect(wsUrl);
    console.log("opening websocket");
    chrome.runtime.sendMessage("websocket-is-open", (res) => {});
  }

  if (message === "stop-ws" /*&& websocket*/) {
    // websocket.close();
    console.log("closing websocket");
    chrome.runtime.sendMessage("websocket-is-closed", (res) => {});
  }

  sendResponse();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!activeAudioTabInfo.id || tabId !== activeAudioTabInfo.id) return;
  // when the title changes the new url will be already set
  if (!changeInfo.title) return;

  activeAudioTabInfo = {
    ...activeAudioTabInfo,
    title: tab.title,
    url: tab.url,
  };

  websocket.send(tab.title.replace(" - YouTube", "").trim());

  console.log(activeAudioTabInfo);
});

chrome.webNavigation.onCompleted.addListener(
  async (e) => {
    const yttab = await chrome.tabs.get(e.tabId);
    console.log(yttab);
    if (yttab.audible || !yttab.mutedInfo.muted) {
      activeAudioTabInfo = {
        id: yttab.id,
        title: yttab.title,
        url: yttab.url,
      };
    }
  },
  // prettier-ignore
  { url: [{ urlMatches: "www\.youtube\.com\/watch" }] }
);

const wsConnect = (url) => {
  websocket = new WebSocket(url);

  websocket.onopen = () => {
    console.log("Connected");
  };

  websocket.onclose = () => {
    console.log("Disconnected");
  };

  websocket.onerror = () => {
    console.log("Connection to websocket failed");
  };

  websocket.onmessage = (e) => {
    console.log("Received: " + e.data);
  };
};
