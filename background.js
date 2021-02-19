let color = '#3aa757';
// you can see what color the app is set to run on, and it's a good reminder that something is working.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});