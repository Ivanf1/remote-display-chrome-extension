const wsUrl = "ws://192.168.0.10/text";
let websocket;
let activeAudioTabInfo = {
  id: null,
  title: null,
  url: null,
};

chrome.alarms.onAlarm.addListener(() => {
  console.log("keep alive ws");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "get-ws-status") {
    sendResponse(!!websocket);
    return;
  }

  if (message === "start-ws" && !websocket) {
    wsConnect(wsUrl);
    sendResponse();
    return;
  }

  if (message === "stop-ws" && websocket) {
    websocket.close();
    sendResponse();
  }
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

  if (websocket) {
    const titleToSend = tab.title.replace(" - YouTube", "").trim();
    sendTextToDisplay(titleToSend);
  }
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

      if (websocket) {
        const titleToSend = yttab.title.replace(" - YouTube", "").trim();
        sendTextToDisplay(titleToSend);
      }
    }
  },
  // prettier-ignore
  { url: [{ urlMatches: "www\.youtube\.com\/watch" }] }
);

const sendTextToDisplay = (text) => {
  console.log({ text });
  websocket.send(text);
};

const wsConnect = (url) => {
  websocket = new WebSocket(url);

  websocket.onopen = () => {
    chrome.runtime.sendMessage("websocket-is-open", () => {});
    chrome.alarms.create("keep-alive-ws", { delayInMinutes: 3 });
    console.log("Connected");
  };

  websocket.onclose = () => {
    websocket = null;
    chrome.runtime.sendMessage("websocket-is-closed", () => {});
    chrome.alarms.clear("keep-alive-ws", () => console.log("timer cleared"));
    console.log("Disconnected");
  };

  websocket.onerror = () => {
    console.log("Connection to websocket failed");
  };

  websocket.onmessage = (e) => {
    console.log("Received: " + e.data);
  };
};
