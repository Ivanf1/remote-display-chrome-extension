const wsUrl = "ws://192.168.0.10/text";
let websocket;
let activeAudioTabInfo = {
  id: null,
  title: null,
  url: null,
};

/**
 * Since service workers will be unloaded after a short period of
 * idle time, we need a way to keep them active in order to keep
 * the websocket connection alive
 * In this case we use an alarm that fires before the service worker
 * gets unloaded
 */
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

// when a tab gets updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  /**
   * There is currently no way to add a listener for a specific tab
   * so this is used as a filter
   */
  if (!activeAudioTabInfo.id || tabId !== activeAudioTabInfo.id) return;

  /**
   * We need to know the new url and the new title of the tab
   * When the title changes, the new url is already set
   * so we only wait for the title to change
   */
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

// when user opens a tab with the youtube url
chrome.webNavigation.onCompleted.addListener(
  async (e) => {
    const yttab = await chrome.tabs.get(e.tabId);
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
