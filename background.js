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
    console.log("opening websocket");
    sendResponse();
    chrome.runtime.sendMessage("websocket-is-open", () => {});
    return;
  }

  if (message === "stop-ws" && websocket) {
    websocket.close();
    console.log("closing websocket");
    sendResponse();
    chrome.runtime.sendMessage("websocket-is-closed", () => {});
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

  const titleToSend = tab.title.replace(" - YouTube", "").trim();

  websocket.send(titleToSend);

  console.log(titleToSend);
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
    chrome.alarms.create("keep-alive-ws", { delayInMinutes: 3 });
    console.log("Connected");
  };

  websocket.onclose = () => {
    chrome.alarm.clear("keep-alive-ws", () => console.log("timer cleared"));
    console.log("Disconnected");
  };

  websocket.onerror = () => {
    console.log("Connection to websocket failed");
  };

  websocket.onmessage = (e) => {
    console.log("Received: " + e.data);
  };
};
