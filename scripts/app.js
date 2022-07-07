// 2022 ernestac
// a simple gallery page built based on the contents of a given passed json string using vanilla js

// global variables and constants    --------------------------------------
// create my array with all my images which is a global constant
// array of items pulled from a JSON input.

// for deployment only
const url = "https://ernestac.github.io/serv.inventory/assets/json/servers.json";
// local testing usage only!
// const url = "../assets/json/servers.json"

// selection color constant
const vSelColor="rgba(0,255,255,0.3)";
const vUnSelColor="rgba(219, 231, 236, 0.0)";
const vCartItemColor="rgba(219, 231, 236, 0.5)";
const vAlertColor="rgba(255, 91, 92, 0.999)";
const vWarnColor="rgba(195, 172, 0, 0.999)";
const vOKColor="rgba(0, 160, 80, 0.999)";

// used for timeout when requesting data
const vTimeOut=2500;
// random selector color indicator constant
const vRndColor = "Orange";
// keymonitoring
let vIsCtrlDn=false;
// page display controllers
let page = 1;
const vItemsPerPage = 20; 
let vCSSClass = "";
let aSelectedTemp = localStorage.getItem("localSavedItems");
let lFirstTime = "";
let aSelected = [];
let vNavMessage="Arrow keys move through pages. Esc dismisses windows and pop-ups.";
let vgResponse = false;

// values for free space evaluation
let cAlertValueUpper = 10; // how much space free is considered alert
let cWarnValueUpper = 25; // how much space free is considered warn

// functions    ----------------------------------------------------------

function doMockPing(){
    let g = 0;
    let vDummy = 0;
    while (g < aImages.length){
        vDummy = doRandomPing();
        if (vDummy/2==Math.trunc(vDummy/2)) {            
            try {
                document.getElementById(`button-pingt${g}`).innerHTML=`${doRandomPing()}ms`;
            } catch {
                //nothing
            }
        }
        g++;
    }            
}


function doCallAToast(vText="Empty",vDuration=2500,vGood="linear-gradient(to right, #005454, #003030)") {
    // run once for top
    Toastify({
        text: `${vText}`,
        duration: vDuration,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        hideProgressBar: false,
        style: {
            fontFamily: "Roboto",
            fontSize: "0.7rem",
            padding: "0.5rem",
            color: "white",
            background: vGood,
        },
      onClick: function(){console.log("Don't click my toasts!")} // Callback after click
    }).showToast();
}

function doExport(vJSONIn){
    // gets the contents of vArrayIn and creates a JSON file to download
    if (aSelected.length != 0){
        try{
            let vFileNameDownload = `ser.inv_export_${WhatTimeIsIt(true)}.json`;
            element = document.createElement('a');
            element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(vJSONIn));
            element.setAttribute('download', vFileNameDownload);
            element.click();
            doPopUp(`download started for ${vFileNameDownload}...`,true,1000);
            return true;
        } catch {
            console.log("Dang, can't download.");
            return false;
        }
    } else {
        doPopUp("Nothing to export, your cart is empty.");
    }
}


function doPing(vIdx){
    // mock function
    doPopUp(`Ping result from ${aImages[vIdx].fqdn}: <p class="reg-text" style="color: green; background-color: black; border-radius: 5px;">${doRandomPing()}ms</p>`,false);
}

function doAccess(vIdx){
    // mock function
    doPopUp(`Access requested to: <p class="reg-text" style="color: rgb(0,64,64); background-color: black; border-radius: 5px;">${aImages[vIdx].fqdn}</p>`,false);
}

function doPopulateButtons(){
    // button writing routine
    document.getElementById("button-prev").innerHTML=`prev`;
    document.getElementById("button-next").innerHTML=`next`;
    document.getElementById("button-all").innerHTML=`*`;
    document.getElementById("button-cart").innerHTML=`to export (0)`;
    document.getElementById("button-help").innerHTML=`?`;
    document.getElementById("page-number").innerHTML=`wait...`;
    document.getElementById("title-app-name").innerHTML=`serv.inventory`;
}

function getIcon(vEngineType="generic"){
    // read local aImageRes array
    
    // START CONSTANT JSON DATA //
    const aIconArray = [{"type":"masking","resource_image":"./assets/images/engine_mas.png"},{"type":"target","resource_image":"./assets/images/engine_tgt.png"},{"type":"virtualserver","resource_image":"./assets/images/engine_grn.png"},{"type":"director","resource_image":"./assets/images/engine_vir.png"},{"type":"batch","resource_image":"./assets/images/engine_red.png"}];
    // END CONSTANT JSON DATA //
    
    let vResponse = ""; // response is empty
    let i = 0; // start index in 0

    while(i < aIconArray.length){
        if (vEngineType == aIconArray[i].type){
            vResponse=aIconArray[i].resource_image; // load the value from the array
            break; // find and stop!
        } else {
            vResponse="./assets/images/engine_gen.png"; // dbhost is not in the icon array, so it uses this one tnat is generic
        }
        i++;
    }
    return vResponse // resturns a string containing the path to the icon image
}

function doResetScroll(){
    //general screen scroll
    window.scrollTo(0, 0);
    document.getElementById('cartboxPopup').scrollTo(0,0);
}

function doPrevious(){
    doClosePopUp();
    doResetScroll();
    if (((page*vItemsPerPage) > 1 || page > 1)){
        page--;
    } else {
        // control pages by comapring the trunc and round results
        page = vTotalPages-1;
    }
    document.getElementById("page-number").innerHTML=`page: ${page+1} of ${vTotalPages}`;
    displayInThumbs(page*vItemsPerPage,(page*vItemsPerPage)+vItemsPerPage);
    randomArrayAccess();
    document.getElementById("activityShow").innerHTML=`${vNavMessage}`;
    doCallAToast(`Page ${page+1} of ${vTotalPages}`,1000);
}

function doAllItems() {
    doResetScroll();
    displayInThumbs();
    page=-1 // reset page number to restart the gallery at page 1
    document.getElementById("page-number").innerText=`${aImages.length} item(s) displayed`;
    document.getElementById("activityShow").innerHTML=`<div class="flex-button" onclick='addAllItemsToCart()'>add all to export</div><div class="flex-button">add only alert & warn</div><div class="flex-button">${aImages.length} item(s)</div>`
    doCallAToast(`Displaying all: ${aImages.length} item(s) retrieved.`, 5000);
}

function addItem(i) {
    let vFoundFlag =  false;
    let ix = 0;
    // read through the selection array and compare the ID, if they match raise a popup and deny the add
    try {
        while (ix != aSelected.lenght) {
            if (aSelected[ix].fqdn == aImages[i].fqdn){
                vFoundFlag = true;
                // NO document.getElementById(`button-add-${i}`).style.visibility=hidden;
                break;
            }
            ix++;
        }
    }
    catch {
        console.log(`With index ${ix} reached the index of te collection. Nothing to worry.`)
    }
    finally{
        if (vFoundFlag) {
            
            // using toastify to replace some popups
            doCallAToast(`Can't add ${aImages[i].fqdn} to export cart.`,3500,vAlertColor)
            
            //doPopUp("Engine not added <br> This Engine is already present in your cart.", false, 1500)
        } else {
            aSelected.push(aImages[i]);
            document.getElementById(`thumb${i}`).backgroundColor=vSelColor;
            localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
            doUpdateCart();
            
            // using toastify to replace some popups
            doCallAToast( `Engine ${aImages[i].fqdn} added to export cart.`,3500,vOKColor);
        }
    }
    
}

function doUpdateCart() {
    document.getElementById('button-cart').innerHTML=`to export (${aSelected.length})`;
}

function doNext(){
    // close potentially open pop-up events
    doResetScroll();
    doClosePopUp();
    // if we still have pages, we add one, otherwise we reset
    if ((page*vItemsPerPage)+vItemsPerPage < aImages.length){
        page++;
    } else {
        page=0;
    }
    //update the page display box
    document.getElementById("page-number").innerHTML=`page: ${page+1} of ${vTotalPages}`;
    // generate the gallery thumbs based on the calculations for page number
    displayInThumbs(page*vItemsPerPage,(page*vItemsPerPage)+vItemsPerPage);
    //write the bottom signature of the page
    randomArrayAccess();
    // print the special message to guide the user
    document.getElementById("activityShow").innerHTML=`${vNavMessage}`;
    doCallAToast(`Page ${page+1} of ${vTotalPages}`,1000);
}

function doRecoverPage(){
    doResetScroll();
    doClosePopUp();
    if (page < 0 ) { // reset the page number to 1 when coming back from the all view
        page = 1;
    }
    document.getElementById("page-number").innerHTML=`page: ${page+1} of ${vTotalPages}`;
    displayInThumbs(page*vItemsPerPage,(page*vItemsPerPage)+vItemsPerPage);
    randomArrayAccess();
    document.getElementById("activityShow").innerHTML="";
}

function addStr(str, index, stringToAdd){
    // injects a string by starting index
    return str.substring(0, index) + stringToAdd + str.substring(index, str.length);
}

function doRecoverSavedItems(){
    // try to load the locally stored values from what has been read
    try{
        aSelected = JSON.parse(aSelectedTemp);
        doUpdateCart();
    }
    catch{
        lFirstTime="yes";
        console.log("Nothing found in local storage or an error occurred. Data is ignored.");
        aSelected=[];
    }
}

function WhatTimeIsIt(vForFile=false){
    //parse the time returned from the object date and turn it into human readable, returns as string
    let today = new Date();
    let yyyy = today.getFullYear();
    //tell mm & dd to have the date's month value and day value respectively
    let mm = today.getMonth() + 1; // In JS months start at 0!
    let dd = today.getDate();

    let hh = today.getHours();
    let hm = today.getMinutes();
    let hs = today.getSeconds();

    //if month or day or hour or minute are 1 digit long, add a leading 0
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    if (hh < 10) hh = '0' + hh;
    if (hm < 10) hm = '0' + hm;
    if (hs < 10) hs = '0' + hs;
    
    // load the hour of the part into vTime
    let vResult;
    if (vForFile) {
        let vTime = `${hh}${hm}${hs}`;
        let vDate = `${yyyy}${mm}${dd}`;
        //load everyting into the string pattern expected and return it
        vResult = `${vDate}${vTime}`;
    } else{
        let vTime = `${hh}:${hm}:${hs}`;
        let vDate = `${mm}/${dd}/${yyyy}`;
        //load everyting into the string pattern expected and return it
        vResult = `${vDate} ${vTime}`;
    }
    return vResult;
}

function randomArrayAccess(){
    //pick a random index using the array's count of items as the ceiling
    let vSelection = Math.floor(Math.random() * aImages.length);
    let vRandomIndex = vSelection;
    let vWTII = WhatTimeIsIt();
    displayInLowerBox(`<p class="reg-text"> ${vWTII}, client local time.</p>`);
    return vRandomIndex;
}

function displayInLowerBox(vTextToPrint){
    //pushes HTML code into the designated box in the index file
    const vBottomText = document.getElementById('bottom-box');
    vBottomText.innerHTML=`${vTextToPrint}`;
}


function doRandomItem() {
    doClosePopUp();
    let vRandomValueID = randomArrayAccess(); //returns the index of the chosen value 
    document.getElementById("page-number").innerHTML=`item: ${vRandomValueID}`;
    displayInThumbs(vRandomValueID,vRandomValueID+1,true); // builds the thumbs     
    //modifyElement(`myitem${vRandomValueID}`,vRndColor); // uses the value to highlight the random item
    document.getElementById("activityShow").innerHTML="Hit an arrow key to return to the gallery view or R to get another random item."
}

function doRandomPing() {
    return Math.trunc(Math.floor(Math.random() * 900));
}


function doPopUp(vMsg,vAuto=false,vDelay=950) {
    document.getElementById("msgboxPopup").style.visibility="visible";
    document.getElementById("backLockPlus").style.visibility="visible";
    let buttonInjector;
    if (vAuto){
        buttonInjector = "";
        setTimeout(doClosePopUp, vDelay);
    }else{
        buttonInjector = `<div id="closeButton" class="flex-button"> close </div>`;
    }
    document.getElementById("msgboxPopup").innerHTML=`<div class="flex-item-msgbox" id="msgOfTheBox"><p class="special-text">${vMsg}</p</div><br><br>${buttonInjector}`;
    if (! vAuto){
        document.getElementById("closeButton").addEventListener("click", function(){
            document.getElementById("msgboxPopup").style.visibility="hidden";
            document.getElementById("backLockPlus").style.visibility="hidden";
        });
    }
}

function doSplashScreen(vtype,vMsg,vAuto=true,vDelay=4000) {
    document.getElementById("msgboxSplash").style.visibility="visible";
    document.getElementById("backLockPlus").style.visibility="visible";
    let buttonInjector;
    if (vAuto){
        buttonInjector = "";
        setTimeout(doClosePopUp, vDelay);
    }else{
        buttonInjector = `<div id="closeButton2" class="flex-button" style="width: 64px;"> close </div>`;
    }
    document.getElementById("msgboxSplash").innerHTML=`<div class="flex-item-splash" id="msgOfTheBox"><p class="flex-item-floater-ttf-logo";>${vtype}</p><p class="reg-text" style="background-color: white; border-radius: 5px; color: black;">${vMsg}</p></div></div><br><br>${buttonInjector}`;
    if (! vAuto){
        document.getElementById("closeButton2").addEventListener("click", function(){
            document.getElementById("msgboxSplash").style.visibility="hidden";
            document.getElementById("backLockPlus").style.visibility="hidden";
        });
    }
}


function doCartBox() {
    let i = 0; //start the cart index in the first item of the array
    let itemInjection = ""; // empty local HTML builder
    let lvCSSClass = "flex-item-cartbox-inner";
    let vButtons = `<div class="flex-button" style="width: 64px;" onclick="doRemoveFromCart(${i})">remove</div><div class="flex-button" style="width: 64px;" onclick="doExport(JSON.stringify(aSelected.slice(${i},${i+1})))">export</div></div></div><br>`
    if (aSelected.length != 0) {
        while (i != aSelected.lenght) {
            try{
                itemInjection = `${itemInjection}<div id="cartmyitem${i}";" class=\"${lvCSSClass}\"><img id="cartthumb${i}" src=\'${getIcon(aSelected[i].engine_type)}\'><p class="reg-text" style="width: 100%;"><b>${aSelected[i].fqdn}</b>${vButtons}`;
                } // build the HTML string
            catch{
                console.log("Maximum selection item array reached.");
                if(i >= aSelected.length){
                    break;
                }
            }
            finally{
                i++; // increment for next idx
            }
        }
    } else {
        itemInjection = `<div class="reg-text">Your cart is empty! <br> Add some items by clicking the 'add' buttons in the gallery view.</div>`;
    }
    document.getElementById("cartboxPopup").style.visibility="visible";
    document.getElementById("cartboxPopup").style.visibility="visible";
    document.getElementById("backLock").style.visibility="visible";
    document.getElementById("cartboxPopup").innerHTML=`<h2>export.cart</h2><div class="flex-item-cartbox" id="msgOfTheCartBox"></div><h5>contents</h5> <div class="flex-item-cartbox" id="msgOfTheCartBox1"></div><br><div id="checkoutCart" class="flex-button" style="width:64px;" onclick="doExport(JSON.stringify(aSelected))"> export data </div> <div class="flex-button" style="width:64px;" onclick="doEmptyCart()">empty</div> <div id="closeButtonCart" style="width:40px;" class="flex-button">dismiss</div>${itemInjection}`;
    document.getElementById("closeButtonCart").addEventListener("click", function(){
        document.getElementById("cartboxPopup").style.visibility="hidden";
        document.getElementById("backLock").style.visibility="hidden";
    });
    document.getElementById("msgOfTheCartBox1").innerHTML=`<p class="reg-text">You have ${aSelected.length} item(s) in the cart.</p>`;
}


function doRemoveFromCart(indexToRemove){
    // removes an item from the selection array based on the index passed
    try {
        aSelected.splice(indexToRemove,1);      // ix position then length
    } catch {
        console.log("Well, the index you passed me does not correspond to an item in my list.");
    }
    finally{
        doClosePopUp();
        doUpdateCart();
        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
        doCartBox();
    }
}

function doEmptyCart(){
    doClosePopUp();
    if (aSelected.length == 0){ // ask if the cart is empty
        doPopUp("Your cart is already empty.", true, 1500);    
    }else{ // if the cart is not empty, empty it
        aSelected=[]; // empty the array
        doUpdateCart(); // recalculate the contents of the cart
        doPopUp("Your cart is now empty.", true, 1500) // text, automatic dismiss and time to dismiss in ms
        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));             // save the value of the array to lStorage to make it session persistent        }
    }
    doCartBox(); // call the cartbox population function
}

function doClosePopUp(){
    // general reusable function
    // clear the screen from any open popups, used in transitions between screens and boxes
    document.getElementById("msgboxSplash").style.visibility="hidden";
    document.getElementById("msgboxPopup").style.visibility="hidden";
    document.getElementById("cartboxPopup").style.visibility="hidden";
    document.getElementById("backLock").style.visibility="hidden";
    document.getElementById("backLockPlus").style.visibility="hidden";
}

function doGoURL(myurl){
    doPopUp(`Opening ${myurl} in new tab...`,true,1000)
    setTimeout(() => {
        window.open(`http://${myurl}`, '_blank')    
    }, 1000);
    
}

function displayInThumbs(vStartIdx = 0, vEndIdx = 0, special=false){
    // main gallery rendering funciton, reads all items from a specified index and displays them. 
    // vStartIdx is where to start reading the array, vEndIdx is where to stop reading and special controls if the item needs a big box around or it is a thumb.
    try{
        /* What 
        Generates the list of images and displays it in a flexbox container using pre-defined styles, and generating the thumbs based on the JSON data attached at the top of the script 
        */
        const vThumbBox = document.getElementById('thumb-box'); // tell vThumbBox that is a page element
        let vButtonInject; // button injector
        let vExtraInject; // extra info injector
        let returnString = ""; // empty the html building string
        if (vEndIdx == 0){vEndIdx=aImages.length;}
        
        if (vEndIdx == 0 ){
            returnString = vThumbBox.innerHTML; // get the current contents of the div to add stuff to
        } else {
            returnString = ``; // empty the return string if the end index is not 0 to clear the gallery page
        }
        // return button adder
        let vReturnButton = `<div class="flex-button" id="button-return" onclick="doRecoverPage()">go back</div>`;
        let i=vStartIdx; // initialize my counter with start index
        // now sweep my array accessing it by index
        // read warning preset value and alert preset value
        while (i < vEndIdx) {
            let vOTFbuttons = `<div class="flex-button" id="button-detail${i}" onclick="dblClickStuff(${i})">detail</div><div class="flex-button" id="button-pingt${i}" onclick="doPing(${i})">ping</div><div class="flex-button" id="button-ping${i}" onclick="doGoURL('http://${aImages[i].fqdn}');">go ></div>`;
            let vPercentFree = 100-Math.round((aImages[i].storage_used/aImages[i].storage)*100); // free space is 100-(percentused)
            if (isNaN(vPercentFree)){
                vPercentFree="NA"
            }
            let vEvalInjector = `<div class="flex-not-button" )">${vPercentFree}%</div>`; // add the type badge first
            // decide alert category and accumulate html
            if (vPercentFree < cAlertValueUpper) {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-alert" onclick="doPopUp('Free space has fallen blow the critical threshold. The server has only ${vPercentFree}% of storage to use. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">alert</div>`;
            } else if ( vPercentFree < cWarnValueUpper) {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-warning" onclick="doPopUp('Free space has fallen blow the warning threshold. The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">warn</div>`
            } else {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-ok" onclick="doPopUp('The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">ok</div>`
            }
            if (! special) {
                // injecting buttons for thumb view
                vCSSClass = "flex-item-articles"; // my class to be injected in the dynamically generated html    
                vButtonInject = `${vOTFbuttons}`;
                vExtraInject = "";
            } else {
                document.getElementById("activityShow").innerHTML=`${vReturnButton}`
                vCSSClass = "flex-item-articles-half-width"; // my other class, used only for special objects
                vButtonInject = `${vOTFbuttons}`;
                vExtraInject = `<br><b>serial: </b>${aImages[i].uuid}<br><b>storage total: </b>${aImages[i].storage}TB<br><b>storage used: </b>${aImages[i].storage_used}TB<br><b>rsa: </b>${aImages[i].rsa_enabled}`;
            }
            // check if the server has apps
            let vAppsBadge = '';
            if (aImages[i].associated_seals != 'vacant'){
                vAppsBadge = '<img id="appbadge${i}" src=\'../assets/images/engine_app.png\'" alt=${aImages[i].associated_seals}}>';
            }
            // accumulate the generated html in the variable
            returnString = `${returnString}<div id="myitem${i}";" class=\"${vCSSClass}\"><div class="flex-item-articles-badges"><img id="thumb${i}" src=\'${getIcon(aImages[i].engine_type)}\' ondblclick="dblClickStuff(${i})" alt=${aImages[i].fqdn}>${vAppsBadge}</div><p class="reg-text" style="width: 100%; height: 100%;"> <b>${aImages[i].fqdn}</b><br><b>type: </b>${aImages[i].engine_type}<br><b>site: </b>${aImages[i].location}<br><b>version: </b>${aImages[i].version}<br><b>app ids: </b>${aImages[i].associated_seals}${vExtraInject}<br></p><div class="flex-item-articles-badges-buttonboard">${vEvalInjector}<div class="flex-button" id="button-add-${i}" onclick="addItem(${i})">add</div>${vButtonInject}</div></div>`; // build the HTML string
            i++; // increment for next idx
        }
        // dump the variable contents as the HTML face of the vThumbBox element.
        vThumbBox.innerHTML=returnString;
        return true;
    }
    catch{ // if there is an error just say it in console and carry on
        //write to console error received
        console.log(`End of routine.`)
        console.log(`Page var: ${page}`)
        console.log(`Page reset to expected value.`)
        return false;
    }
}

function addAllItemsToCart(){
    aSelected = aImages
    doUpdateCart();
    localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
    doPopUp(`${aSelected.length} servers added to the export cart.`,true,1500);
}

function clickStuff(vItemIndex){
    if (! vIsCtrlDn) {
        clearStuff();
    }
    if (document.getElementById(`thumb${vItemIndex}`).style.backgroundColor == vSelColor){
        document.getElementById(`thumb${vItemIndex}`).style.backgroundColor = vUnSelColor; // uses the of unselcolor to remove highlight        
    } else {
        document.getElementById(`thumb${vItemIndex}`).style.backgroundColor=vSelColor; // uses the value to highlight the clicked item        
    }
}

function dblClickStuff(vItemIndex){
    if (vIsCtrlDn) {
        doSplashScreen(aImages[vItemIndex].fqdn,`<p class="special-text">asset type: ${aImages[vItemIndex].engine_type}<br>used: ${aImages[vItemIndex].storage_used}TB<br>installed: ${aImages[vItemIndex].storage}TB<br>location: ${aImages[vItemIndex].location}<br>rsa enabled: ${aImages[vItemIndex].rsa_enabled}<br>asset uuid: ${aImages[vItemIndex].uuid}<br>app ids: ${aImages[vItemIndex].associated_seals}</p>`,false,0)
    }else{
        doClosePopUp();
        document.getElementById("page-number").innerHTML=`item: ${vItemIndex}`;
        displayInThumbs(vItemIndex,vItemIndex+1,true); // builds the thumbs     
    }
}

function clearStuff(){
    // clear all selections from the page
    let i=0; // start an empty counter
    while (i < aImages.length) {
        try {
            document.getElementById(`thumb${i}`).style.backgroundColor=vUnSelColor;
        }
        catch {
            console.log('Cleared selection.');        
        }
        i++; // increment for next idx
    }
}

// main code ----------------------------------------------------------
// here goes the code for calling the rendering functions
//KEY LISTENERS

doPopulateButtons();

document.addEventListener('keydown', (event) => {
// should use switch case instead of a large list of if
    let name = event.key;

    if (name == "A" || name == "a"){
        doAllItems();
    }
    if (name == "R" || name == "r"){
        doRandomItem();
    }
    if (name == "ArrowRight"){
        doNext();
    }
    if (name == "ArrowLeft"){
        doPrevious();
    }
    if (name == "Control"){
        vIsCtrlDn=true;
    }
    if (name == "Escape"){
        doClosePopUp();
    }
}, false);

document.addEventListener('keyup', (event) => {
    let name = event.key;
    if (name == "Control"){
        vIsCtrlDn=false;
    }
}, false);


//TOP BUTTON LISTENERS
document.getElementById("button-prev").addEventListener("click", function(){
    doPrevious();
});
document.getElementById("button-next").addEventListener("click", function(){
    doNext();
});
document.getElementById("button-all").addEventListener("click", function(){
    doAllItems();
});
document.getElementById("page-number").addEventListener("click", function(){
    console.log("Don't just click stuff.")
});

//BOTTOM BUTTON LISTENERS
document.getElementById("button-cart").addEventListener("click", function(){
    doCartBox();
});
document.getElementById("button-help").addEventListener("click", function(){
    doSplashScreen("serv.inventory help","Use the left and right arrow keys to move between gallery pages. <br> Use R to get a random item <br>  Use Esc to dismiss pop-ups and windows.<br>Clicking the 'add' buttons below each item adds it to the download cart. <br><br> The contents of your cart are saved for your next visit.",false,0)
});

//PAGE RENDERING SECTION
/*READ ME -----------------------------------------------
The statements below control the start of page behavior.
*/

let vTotalPages = 0;

// async loading of the main json file
let aImages = [];
(function() {
    fetch(url)
    .then(response => response.json())
    .then(json => {
        aImages = [...json];
        vTotalPages = Math.trunc(aImages.length/vItemsPerPage)+1;
        if (lFirstTime == "yes"){
            doSplashScreen(`Hi there! This is serv.inventory.`,`Looks like it is your first time here.<br><br>Be sure to check out the help (?) button on the bottom bar.`,false)
            localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
        }else{
            console.log('Welcome back.');
            doSplashScreen("serv.inventory, loading...","",true,vTimeOut+10000);
        }  

    })
})();



// this is outside - might be empty, if the response does
// not arrive under the preset time in ms
setTimeout(() => {
    console.log("data in setTimeout", aImages)
    page=-1; // force page to -1 on first render for the page number box, this is also used to signify that we are looking at the entire contents of the gallery
    doRecoverSavedItems(); // read localStorage saved data
    doNext(); // run doNext to render the 1st page of the gallery
    // POP UP ACTION FOR THE FIRST TIME VISIT OF THE PAGE
    // this needs to happen after the page is rendered
    doClosePopUp();
    // start the ping simulator once page loaded or failed
    setInterval(doMockPing, 750);
}, vTimeOut)

