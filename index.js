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

  toggleWsConnectionBtn.addEventListener("click", async () => {
    chrome.runtime.sendMessage(isWsOpen ? "stop-ws" : "start-ws", (res) => {});
  });
});
