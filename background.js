let activeAudioTabInfo = {
  id: null,
  title: null,
  url: null,
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!activeAudioTabInfo.id || tabId !== activeAudioTabInfo.id) return;
  if (!changeInfo.url && !changeInfo.title) return;

  if (activeAudioTabInfo.url !== tab.url) {
    activeAudioTabInfo.url = tab.url;
  }

  if (activeAudioTabInfo.title !== tab.title) {
    activeAudioTabInfo.title = tab.title;
  }
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
