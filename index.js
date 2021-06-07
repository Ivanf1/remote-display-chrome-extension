let toggleWsConnectionBtn;
let isWsOpen;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "websocket-is-open") {
    toggleWsConnectionBtn.innerHTML = "disconnect";
    isWsOpen = true;
  }

  if (message === "websocket-is-closed") {
    toggleWsConnectionBtn.innerHTML = "connect";
    isWsOpen = false;
  }

  sendResponse();
});

window.addEventListener("DOMContentLoaded", async () => {
  toggleWsConnectionBtn = document.getElementById("ws_connect_btn");

  chrome.runtime.sendMessage("get-ws-status", (res) => {
    isWsOpen = res;
    toggleWsConnectionBtn.innerHTML = isWsOpen ? "disconnect" : "connect";
  });

  toggleWsConnectionBtn.addEventListener("click", async () => {
    chrome.runtime.sendMessage(isWsOpen ? "stop-ws" : "start-ws", (res) => {});
  });
});
