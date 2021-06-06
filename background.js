// chrome.runtime.onInstalled.addListener(async () => {
//   await chrome.tabs.query({}, (tabs) => {
//     console.log(tabs);
//     const yttabs = tabs.filter((tab) => /www\.youtube\.com/.test(tab.url));
//     console.log(yttabs);
//   });
// });

let activeAudioTabId;

chrome.webNavigation.onCompleted.addListener(
  async (e) => {
    const yttab = await chrome.tabs.get(e.tabId);
    console.log(yttab);
    if (yttab.audible || !yttab.mutedInfo.muted) {
      activeAudioTabId = yttab.id;
    }
    console.log(activeAudioTabId);
  },
  // prettier-ignore
  { url: [{ urlMatches: "www\.youtube\.com\/watch" }] }
);
