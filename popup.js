$(function(){
    //this function makes sure the previous analysis persists when the popup is reopened.
    chrome.storage.sync.get(['analysis'],function(response){
        //if there is stored analysis, put that in the popup
        if (response.analysis) {
            // turn the string back into JSON
            updateInfo = JSON.parse(response.analysis);
            // update the UI with the analysis
            $('#gender').text('Gender: ' + updateInfo.predictions.gender.prediction);
            $('#tone').text('Tone: ' + updateInfo.predictions.tone.prediction);
            $('#age').text('Age: ' + updateInfo.predictions.age.prediction);
        }
    });
    
    // this is the function that updates the popup UI
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        var updateInfo = '';
        // getting analysis from the chrome extension storage (I stored it as a string):
        chrome.storage.sync.get(['analysis'],function(response){
        // turn the string back into JSON
        updateInfo = JSON.parse(response.analysis);
        // update the UI with the analysis
        $('#gender').text('Gender: ' + updateInfo.predictions.gender.prediction);
        $('#tone').text('Tone: ' + updateInfo.predictions.tone.prediction);
        $('#age').text('Age: ' + updateInfo.predictions.age.prediction);
    });
  });
    
    // Initialize button with user's preferred color
    let analyze = document.getElementById("analyze");
    
    chrome.storage.sync.get("color", ({ color }) => {
      analyze.style.backgroundColor = color;
    });
    
    // When the button is clicked, inject analysis into popup
    analyze.addEventListener("click", async () => {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: sendMessage,
      });
    });

    // The body of this function will be executed as a content script inside the
    // current page
    
    //gets highlighted text, sends api call to https://www.judecapachietti.com/api/textAnalysis, stores that in chrome extension storage,
    //then sends a message to the function at the top of the page to update the UI
    function sendMessage() {
        //initializing variables:
        var analysis = ''
        var textInput = '';
        var html = document.createElement("DIV");
        
        //code snippet to get all highlighted text, no matter what type of html tag it is in -- that is why this looks so complicated
        if (typeof window.getSelection != "undefined") {
            var sel = window.getSelection();
            if (sel.rangeCount) {
                var container = document.createElement("div");
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    container.appendChild(sel.getRangeAt(i).cloneContents());
                }
                html.innerHTML = container.innerHTML;
            }
        } else if (typeof document.selection != "undefined") {
            if (document.selection.type == "Text") {
                html.innerHTML = document.selection.createRange().htmlText;
            }
        }
        //re-labeling the html text content to be able to read this code better
        textInput = html.textContent;
        
        //if there is highlighted text, then make an api call to my end point, and save it to the chrome storage, then send a messge to the other function to update the ui with the saved data.  I cannot update the UI from this function.  I do not know why but it is some restriction and like threads and workers and blah blah blah
        if (textInput != '') {
            var analysis = '';
            var xhttp = new XMLHttpRequest();
            xhttp.open("POST", "https://www.judecapachietti.com/api/textAnalysis",true);
            xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            // this is waiting for the response to come back to avoid sending over {} instead of the data
            xhttp.onload = function (e) {
              if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {
                    // this is where I parse the data, store it and send a message to the other function, again it is in here so it doesn't send over {} and leave me very confused.
                    analysis = JSON.parse(xhttp.responseText)
                    chrome.storage.sync.set({analysis: JSON.stringify(analysis)});
                    chrome.runtime.sendMessage({ message: "analysis to be displayed"});

                } else {
                  console.error(xhttp.statusText);
                }
              }
            };
            xhttp.onerror = function (e) {
              console.error(xhttp.statusText);
            };
            // this is the physical sending of the request I think.. idk I should just use axios.  I am not sure why I did it the 2008 way... It gave me 13 years worth of headaches for sure.
            xhttp.send(JSON.stringify({ "textInput" : textInput }));
        }
    }
});