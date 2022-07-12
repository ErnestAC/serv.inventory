// 2022 ernestac
// a simple gallery page built based on the contents of a given passed json string using vanilla js

// global variables and constants    --------------------------------------
// create my array with all my images which is a global constant
// array of items pulled from a JSON input.

const vAppTitle = `JSA Serv.explorer`
const windowTitle = document.getElementById(`app-Title`)

// for deployment only
const url = "https://ernestac.github.io/serv.inventory/assets/json/servers.json";
// local testing usage only!
// const url = "../assets/json/xservers.json"

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
let vNavMessage = '';
let vgResponse = false;

// values for free space evaluation
let cAlertValueUpper = 10; // how much space free is considered alert
let cWarnValueUpper = 25; // how much space free is considered warn
let vCountAlert = 0;
let vCountWarn = 0;
let vCountOK = 0;

// ui object constants
const oButtonAll = document.getElementById("button-all");
const oCartBoxPopUp = document.getElementById("cartboxPopup");
const oButtonCart = document.getElementById("button-cart");
const oBackLockPlus = document.getElementById("backLockPlus");
const oPageNumber = document.getElementById("page-number");
const oInnerButtons = document.getElementById("activityShow");
const oButtonSearch = document.getElementById("button-search");
const oTitleAppName = document.getElementById("title-app-name");
const oMsgBoxPopUp = document.getElementById("msgboxPopup");
const oSearchBox = document.getElementById("search-box");


// functions    ----------------------------------------------------------

function doSearch(searchTerm) {
    // reset display
    aImages = aImagesMirror;
    doAllItems();
    let ix;
    let aFound = [];
    let exists;
    ix = 0;
    while (ix < aImages.length){
        try {
        exists = `${aImages[ix].fqdn} | ${aImages[ix].location} | ${aImages[ix].engine_type}${aImages[ix].associated_seals} | ${aImages[ix].version} | ${aImages[ix].uuid} | ${aImages[ix].placeholder1$} | ${aImages[ix].rsa_enabled}`;
        if (exists.indexOf((searchTerm)) > -1){
            aFound.push(aImages[ix]);
        }
        }
        
        catch {
            console.log("OK0");
        }
        finally {
            ix++;
        }
    }
    aImages = aFound;
    doAllItems();
    oInnerButtons.innerHTML = `<div class="flex-button" onclick="doAllItems()">go back</div>`;
    // NO 
    doPopUp(oPageNumber.innerText,true,2000);
}


async function requestDataFromURL(inURL='https://ernestac.github.io/serv.inventory/') {
    const incomingData = await fetch(inURL);
    const incomingText = await incomingData;
    console.log(incomingText);
}

function doMockPing(){
    let g = 0;
    let vDummy = 0;
    while (g < aImages.length){
        vDummy = doRandomPing();
        if (vDummy/2==Math.trunc(vDummy/2)) {            
            try {
                document.getElementById(`button-pingt${g}`).innerHTML=`${doRandomPing()}ms`;
            } catch {
                //nothing, let it fail silently
            }
        }
        g++;
    }
    return true;            
}    

function doCallAToast(vText="Empty",vDuration=1500,vGood="linear-gradient(to right, #005454, #003030)") {
    try{
        Toastify({
            text: `${vText}`,
            duration: vDuration,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            hideProgressBar: true,
            style: {
                fontFamily: "Roboto",
                fontSize: "0.7rem",
                padding: "0.5rem",
                color: "white",
                background: vGood,
            },
        onClick: function(){console.log("Don't click my toasts!")} // Callback after click
        }).showToast();
        return true;
    } catch {
        console.log('No toast for you...')
        return false;
    }
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


function doPing(){
    // mock function
    doPopUp(`Simulated ping: <p class="reg-text" border-radius: 5px;">${doRandomPing()}ms</p>`,false);
}

function doAccess(vIdx){
    // mock function
    doPopUp(`Access requested to: <p class="reg-text" style="color: rgb(0,64,64); background-color: black; border-radius: 5px;">${aImages[vIdx].fqdn}</p>`,false);
}

function doPopulateButtons(){
    // button writing routine
    oButtonAll.innerHTML=`refresh`;
    oButtonCart.innerHTML=`export (0)`;
    oButtonSearch.innerHTML=`filter`;
    oPageNumber.innerHTML=`loading...`;
    oTitleAppName.innerHTML=`${vAppTitle}`;
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
    oCartBoxPopUp.scrollTo(0,0);
    //refresh page box
    if (page>(-1)){
        if (page < 0){
            vNavMessage=`<div class="flex-button" style="width:64px";>items ${(page)*vItemsPerPage} </div><div class="flex-button" style="width:64px";>page ${page+2} </div>`
        }
    }

}

function doResetCounters() {
    vCountAlert=0;
    vCountWarn=0;
    vCountOK=0;
}

function doAllItems(showToast = false) {
    try{
        doResetScroll();
        doResetCounters();
        displayInThumbs();
        page=-1 // reset page number to restart the gallery at page 1
        oPageNumber.innerText=`${aImages.length} item(s) displayed`;
        oInnerButtons.innerHTML=`<div class="flex-button" onclick='sortBy("fqdn")'>sort by fqdn</div><div class="flex-button" onclick='sortBy("space free")'>free space</div><div class="flex-button" onclick='sortBy("engine type")'>type</div><div class="flex-button" onclick='sortBy("storage")'>size</div><div class="flex-button" onclick='addAllItemsToCart()'>add all to export</div>`
        if (showToast){
            doCallAToast(`displaying: ${aImages.length} item(s) retrieved.`, 1500);
        }
        return true; 
    } catch {
        return false;
    }
}

function addItem(i) {
    let vFoundFlag =  false;
    let ix = 0;
    // read through the selection array and compare the ID, if they match raise a popup and deny the add
    if (aSelected == null){
        aSelected = [];
        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
    }
    try {
        while (ix < aSelected.length) {
            if (aSelected[ix].fqdn == aImages[i].fqdn){
                vFoundFlag = true;
                // NO document.getElementById(`button-add-${i}`).style.visibility=hidden;
                break;
            }
            ix++;
        }
        return true;
    }
    catch {
        console.log(`With index ${ix} reached the index of te collection. Nothing to worry.`)
        return false;
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
    try {
        oButtonCart.innerHTML=`export (${aSelected.length})`;
        return true;    
    } catch (error) {
        console.log(`${error} - Can't update the cart.`);
        return false;
    }
    
}

function doRecoverPage(){
    try {
        doResetScroll();
        doClosePopUp();
        if (page < 0 ) { // reset the page number to 1 when coming back from the all view
            page = 1;
        }
        oPageNumber.innerHTML=`page: ${page+1} of ${vTotalPages}`;
        displayInThumbs(page*vItemsPerPage,(page*vItemsPerPage)+vItemsPerPage);
        randomArrayAccess();
        oInnerButtons.innerHTML="";
        return true;
    } catch {
        return false;
    }
}

function doRecoverSavedItems(){
    // try to load the locally stored values from what has been read
    try{
        aSelected = JSON.parse(aSelectedTemp);
        doUpdateCart();
        return true;
    }
    catch{
        lFirstTime="yes";
        console.log("Nothing found in local storage or an error occurred. Data is ignored.");
        aSelected=[];
        doUpdateCart()
        return false;
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
    oPageNumber.innerHTML=`item: ${vRandomValueID}`;
    displayInThumbs(vRandomValueID,vRandomValueID+1,true); // builds the thumbs     
}

function doRandomPing() {
    return Math.trunc(Math.floor(Math.random() * 500));
}

function doPopUp(vMsg,vAuto=false,vDelay=950) {
    try {
        oMsgBoxPopUp.style.visibility="visible";
        oBackLockPlus.style.visibility="visible";
        let buttonInjector;
        if (vAuto){
            buttonInjector = "";
            setTimeout(doClosePopUp, vDelay);
        }else{
            buttonInjector = `<div id="closeButton" class="flex-button"> close </div>`;
        }
        oMsgBoxPopUp.innerHTML=`<div class="flex-item-msgbox" id="msgOfTheBox"><p class="special-text">${vMsg}</p</div><br><br>${buttonInjector}`;
        if (! vAuto){
            document.getElementById("closeButton").addEventListener("click", function(){
                oMsgBoxPopUp.style.visibility="hidden";
                oBackLockPlus.style.visibility="hidden";
            });
        }
    } catch {
        return false;
    }
}

function doSplashScreen(vtype,vMsg,vAuto=true,vDelay=4000) {
    document.getElementById("msgboxSplash").style.visibility="visible";
    oBackLockPlus.style.visibility="visible";
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
            oBackLockPlus.style.visibility="hidden";
        });
    }
}


function doCartBox() {
    let i = 0; //start the cart index in the first item of the array
    let itemInjection = ""; // empty local HTML builder
    let lvCSSClass = "flex-item-articles";
    let vButtons = `<div><div class="flex-button" style="width: 64px;" onclick="doRemoveFromCart(${i})">remove</div><div class="flex-button" style="width: 64px;" onclick="doExport(JSON.stringify(aSelected.slice(${i},${i+1})))">export</div></div></div><br>`
    if (aSelected.length != 0) {
        while (i < aSelected.length) {
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
        aSelected = [];
        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
        itemInjection = `<div class="reg-text">Your cart is empty! <br> Add some items by clicking the 'add' buttons in the gallery view.</div>`;
    }
    oCartBoxPopUp.style.visibility="visible";
    document.getElementById("backLock").style.visibility="visible";
    oCartBoxPopUp.innerHTML=`<h2 style="width: 100%;">export.cart</h2><div class="flex-item-cartbox" id="msgOfTheCartBox"></div><div class="flex-item-articles-badges-buttonboard-horizontal"><br><div id="checkoutCart" class="flex-button" style="width:64px;" onclick="doExport(JSON.stringify(aSelected))"> export data </div> <div class="flex-button" style="width:64px;" onclick="doEmptyCart()">empty</div> <div id="closeButtonCart" style="width:64px;" class="flex-button">dismiss</div></div>${itemInjection}<div class="flex-item-cartbox" id="msgOfTheCartBox1"></div>`;
    const oCartBoxText = document.getElementById("msgOfTheCartBox");
    const oCartBoxText1 = document.getElementById("msgOfTheCartBox1");
    document.getElementById("closeButtonCart").addEventListener("click", function(){
    oCartBoxPopUp.style.visibility="hidden";
    document.getElementById("backLock").style.visibility="hidden";
    });
    oCartBoxText.innerHTML=`<p class="reg-text">You have ${aSelected.length} item(s) in the cart.</p>`;
    oCartBoxText1.innerHTML=`<p class="reg-text">You have ${aSelected.length} item(s) in the cart.</p>`;
}


function doRemoveFromCart(indexToRemove){
    // removes an item from the selection array based on the index passed
    try {
        aSelected.splice(indexToRemove,1);      // ix position then length
        return true;
    } catch {
        console.log("Well, the index you passed me does not correspond to an item in my list.");
        return false;
    } finally {
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
    } else { // if the cart is not empty, empty it
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
    oMsgBoxPopUp.style.visibility="hidden";
    oCartBoxPopUp.style.visibility="hidden";
    document.getElementById("backLock").style.visibility="hidden";
    oBackLockPlus.style.visibility="hidden";
}

function doGoURL(myurl){
    doPopUp(`Opening ${myurl} in new tab...`,true,1000)
    setTimeout(() => {
        window.open(`http://${myurl}`, '_blank')    
    }, 1000);
    
}

function displayInThumbs(vStartIdx = 0, vEndIdx = 0, special = false){
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
        // return button adder
        let vReturnButton = `<div class="flex-button" id="button-return" onclick="doAllItems()">go back</div>`;
        let i=vStartIdx; // initialize my counter with start index
        let vSummaryInject = "";
        if (vEndIdx == 0){vEndIdx=aImages.length;}
        if (vEndIdx == 0 ){
            returnString = vThumbBox.innerHTML; // get the current contents of the div to add stuff to
        } else {
            returnString = ``; // empty the return string if the end index is not 0 to clear the gallery page
        }
        // now sweep my array accessing it by index
        // read warning preset value and alert preset value
        while (i < vEndIdx) {
            let vOTFbuttons = `<div class="flex-button" id="button-pingt${i}" onclick="doPing(${i})">ping</div><div class="flex-button" id="button-go${i}" onclick="doGoURL('http://${aImages[i].fqdn}');">go ></div><div class="flex-button" id="button-detail${i}" onclick="dblClickStuff(${i})">detail</div>`;
            let vPercentFree = 100-Math.round((aImages[i].storage_used/aImages[i].storage)*100); // free space is 100-(percentused)
            let vEvalInjector = `<div class="flex-not-button" )">${aImages[i].storage}TB</div>`; // add the type badge first
            let vAppsBadge = '';
            aImages[i].placeholder1 = `${vPercentFree}`;
            // decide alert category and accumulate html
            if (vPercentFree < cAlertValueUpper) {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-alert" onclick="doPopUp('Free space has fallen blow the critical threshold. The server has only ${vPercentFree}% of storage to use. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">${vPercentFree}%</div>`;
                vCountAlert++
            } else if ( vPercentFree < cWarnValueUpper) {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-warning" onclick="doPopUp('Free space has fallen blow the warning threshold. The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">${vPercentFree}%</div>`;
                vCountWarn++
            } else {
                vEvalInjector = `${vEvalInjector}<div class="flex-no-button-ok" onclick="doPopUp('The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used} out of ${aImages[i].storage} installed.')">${vPercentFree}%</div>`;
                vCountOK++
            }
            if (! special) {
                // injecting buttons for thumb view
                vCSSClass = "flex-item-articles"; // my class to be injected in the dynamically generated html    
                vButtonInject = `${vOTFbuttons}`;
                vExtraInject = "";
                vSummaryInject= `<div id="myitem${i}";" class="flex-item-articles-summary"><div class="flex-item-articles-badges"><!--X--></div><p class="reg-text" style="width: 100%; height: 100%;"> <b>grid summary</b><br>----------------------------<br><b>server count: </b>${aImages.length}<br><b>overview: </b>${aImages[i].location}<br><b>last refresh: </b>${WhatTimeIsIt()}<br><b>data range: </b>all<br></p><div class="flex-item-articles-badges-buttonboard"><div class="flex-button" id="summary_title">summary</div><div class="flex-no-button-alert" id="summary_alert">${vCountAlert}</div><div class="flex-no-button-warning" id="summary_warning">${vCountWarn}</div><div class="flex-no-button-ok" id="summary_ok">${vCountOK}</div></div></div>`;
            } else {
                oInnerButtons.innerHTML=`${vReturnButton}`
                vCSSClass = "flex-item-articles-half-width"; // my other class, used only for special objects
                vButtonInject = `${vOTFbuttons}`;
                vExtraInject = `<br><b>serial: </b>${aImages[i].uuid}<br><b>storage total: </b>${aImages[i].storage}TB<br><b>storage used: </b>${aImages[i].storage_used}TB<br><b>rsa: </b>${aImages[i].rsa_enabled}`;
                vSummaryInject= "";
            }
            // check if the server has apps   
            if (aImages[i].associated_seals != 'vacant' && aImages[i].associated_seals !="" ){
                vAppsBadge = `<img id="appbadge${i}" src='./assets/images/engine_app.png' alt=${aImages[i].associated_seals}}>`;
            }
            // accumulate the generated html in the variable
            returnString = `${returnString}<div id="myitem${i}";" class=\"${vCSSClass}\"><div class="flex-item-articles-badges"><img id="thumb${i}" src=\'${getIcon(aImages[i].engine_type)}\' ondblclick="dblClickStuff(${i})" alt=${aImages[i].fqdn}>${vAppsBadge}</div><p class="reg-text" style="width: 100%; height: 100%;"> <b>${aImages[i].fqdn}</b><br><b>type: </b>${aImages[i].engine_type}<br><b>site: </b>${aImages[i].location}<br><b>version: </b>${aImages[i].version}<br><b>app ids: </b>${aImages[i].associated_seals}${vExtraInject}<br></p><div class="flex-item-articles-badges-buttonboard">${vEvalInjector}${vButtonInject}<div class="flex-button" id="button-add-${i}" onclick="addItem(${i})">add</div></div></div>`; // build the HTML string
            i++; // increment for next idx
        }
        // dump the variable contents as the HTML face of the vThumbBox element.
        vThumbBox.innerHTML=`${vSummaryInject}${returnString}`;
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
    // copy one array into the other, then save and update
    aSelected = aImages
    doUpdateCart();
    localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
    doPopUp(`${aSelected.length} servers added to the export cart.`,true,2000);
}

function dblClickStuff(vItemIndex){
    if (vIsCtrlDn) {
        doSplashScreen(aImages[vItemIndex].fqdn,`<p class="special-text">asset type: ${aImages[vItemIndex].engine_type}<br>used: ${aImages[vItemIndex].storage_used}TB<br>installed: ${aImages[vItemIndex].storage}TB<br>location: ${aImages[vItemIndex].location}<br>rsa enabled: ${aImages[vItemIndex].rsa_enabled}<br>asset uuid: ${aImages[vItemIndex].uuid}<br>app ids: ${aImages[vItemIndex].associated_seals}</p>`,false,0)
    }else{
        doClosePopUp();
        oPageNumber.innerHTML=`item: ${vItemIndex}`;
        displayInThumbs(vItemIndex,vItemIndex+1,true); // builds the thumbs     
    }
}

function sortBy(vAttrOrdinalPos = 'fqdn'){
    // order of options:
    // 1fqdn,2location,3engine_type,4storage,
    // 5storage_used,6associated_seals,7version,8uuid,9rsa_enabled
    switch (vAttrOrdinalPos) {
        case 'fqdn':
            aImages.sort((a, b) => (a.fqdn > b.fqdn) ? 1 : -1);
            break;
        case 'location':
            aImages.sort((a, b) => (a.location > b.location) ? 1 : -1);
            break;
        case 'engine type':
            aImages.sort((a, b) => (a.engine_type > b.engine_type) ? 1 : -1);
            break;
        case 'storage':
            aImages.sort((a, b) => (a.storage < b.storage) ? 1 : -1);
            break;                  
        case 'storage used':
            aImages.sort((a, b) => (a.storage_used > b.storage_used) ? 1 : -1);
            break;
        case 'space free':
            aImages.sort((a, b) => ((100-(a.storage_used/a.storage)) > (100-(b.storage_used/b.storage))) ? 1 : -1);
            break;
        default:
            break;
    }
    doCallAToast(`sorting by ${vAttrOrdinalPos}`);
    doAllItems();
}

//pre boot routine
function doPreBoot(){
//modern
    windowTitle.innerText = `${vAppTitle} loading`;

    fetch(url).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Can't read from ${url}`);
    })
    .then((responseJson) => {
        aImages = [...responseJson];
                    vTotalPages = Math.trunc(aImages.length/vItemsPerPage)+1;
                    if (lFirstTime == "yes"){
                        doSplashScreen(`Starting ${vAppTitle}`,`Saving initialization data.`,false)
                        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
                    }else{
                        console.log('Welcome back.');
                        doSplashScreen(`${vAppTitle.toLowerCase()}, loading...`,"",false);
                        aImagesMirror = aImages;
                    }  
    })
    .catch((error) => {
        doPopUp(`Error: Can't read data from ${url}. Retrying...`,true,10000);
        //recursive call to self
        setTimeout(() => {
            doPreBoot();    
        }, vTimeOut);
        console.log(error)
    });
}

function doBootApp(){
    // call preloading async routine
    vCountAlert=0;
    vCountWarn=0;
    vCountOK=0;
    doPreBoot();
    //wait for it...
    setTimeout(() => {
        //bootstraping routine
        // fetch my data sources in under vDelay ms
        windowTitle.innerText = `${vAppTitle}`;
        doRecoverSavedItems(); // read localStorage saved data
        page=0; // force page to -1 on first render for the page number box, this is also used to signify that we are looking at the entire contents of the gallery
        sortBy('fqdn'); // sort and boot
        // POP UP ACTION FOR THE FIRST TIME VISIT OF THE PAGE
        // this needs to happen after the page is rendered
        if (aSelected == null){
            aSelected = [];
            localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
        }
        doClosePopUp();
        // start the ping simulator once page loaded or failed
        setInterval(doMockPing, 750);
        requestDataFromURL();
    }, vTimeOut);
}

// main code ----------------------------------------------------------
// here goes the code for calling the rendering functions
//KEY LISTENERS

doPopulateButtons();

document.addEventListener('keydown', (event) => {
// should use switch case instead of a large list of if
    let name = event.key;
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
oButtonAll.addEventListener("click", function(){
    //re-request all and sends you back to top
    doBootApp();
});
oPageNumber.addEventListener("click", function(){
    console.log("Don't just click stuff.")
});
document.getElementById('button-support').addEventListener("click", function(){
    doPopUp(`This function (${document.getElementById('button-support').innerHTML}) is not ready yet.`);
});
document.getElementById('button-team').addEventListener("click", function(){
    doPopUp(`This function (${document.getElementById('button-team').innerHTML}) is not ready yet.`);
});
oButtonCart.addEventListener("click", function(){
    doCartBox();
});
oButtonSearch.addEventListener("click", function(){
    doSearch(oSearchBox.value);
});
oSearchBox.addEventListener("click", function(){
    doCallAToast("Hit ENTER to search",10000,vOKColor);
    oSearchBox.value="";
});

//COLD BOOT PARAMETERS
let vTotalPages = 0;
let aImages = [];
let aImagesMirror = [];
oSearchBox.value="(search)";
doBootApp(); //BOOT APP
