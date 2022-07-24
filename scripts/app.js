// 2022 ernestac
// ernestac@github
// a simple monitoring dsahboard page built based on the contents of a given set of passed json strings using vanilla JS and JSON Web APIs

// two files are read from the webserver, being url, and url_storage. these files must be merged at array level producing no duplicates and only unique entries. if an item is identified in the array to be repeated, url_storage's values are given precedence over url's.

// the presentation is done in a dashboard grid depicting each server in the grid as dictated by the above described process for merging the contents of both data soruces url and url_storage.

// the application is logically organized as follows:
//
// APP LOAD ----------------------------> DISPLAY <-------| ACTIONS -------------------- MODAL ACTIONS
//
// PREBOOT -----------> BOOT -----------> DISPLAY <-------| REFRESH                      CART WINDOW
// LOAD STORAGE         TIMEOUT           LISTEN EVENTS   | VIEW OPTION                  | EXPORT CART
// LOAD URL_STOR        SORT ARRAY        REFRESH SCR     | EXPORT <-------------------- | DELETE FROM CART
// LOAD URL_SERV        DRAW ARRAY        GENERIC POPUP   | SEARCH                       | EMPTY
// RETRY                SPLASH                            | RESET SCROLL
//                                                        | GRID SUB-VIEW <------------- GRID VIEW WINDOW
//

// # APP #############################################################################################################
// global variables and constants    --------------------------------------
// create my array with all my images which is a global constant
// array of items pulled from a JSON input.

const vAppTitle = `JSA Serv.explorer`
const windowTitle = document.getElementById(`app-Title`)

// for deployment only
const url = "https://ernestac.github.io/serv.inventory/assets/json/servers.json";
const url_storage = "https://ernestac.github.io/serv.inventory/assets/json/storage.json";
const url_ndc = "https://ernestac.github.io/serv.inventory/assets/json/servers_ndc.json";

// selection color constant
const vSelColor = "rgba(0, 32, 32, 0.999)";
const vUnSelColor = "rgba(219, 231, 236, 0.0)";
const vCartItemColor = "rgba(219, 231, 236, 0.5)";
const vAlertColor = "rgba(255, 91, 92, 0.999)";
const vWarnColor = "rgba(195, 172, 0, 0.999)";
const vOKColor = "rgba(0, 160, 80, 0.999)";

// used for timeout when requesting data
const vTimeOut = 2500;
// random selector color indicator constant
const vRndColor = "Orange";
// keymonitoring
let vIsCtrlDn = false;
// page display controllers
let page;
const vItemsPerPage = 20; 
let vCSSClass = "";
let aSelectedTemp = localStorage.getItem("localSavedItems");
let lFirstTime = "";
// selection and localstorage arrays read from settings
let aSelected = [];
let aNotes = [];
let vCompact = false;
let vIsSummaryHidden;

// navigation message
let vNavMessage = '';
// global response witness
let vgResponse = false;


// settings for free space evaluation
let cAlertValueUpper = 10; // how much space free is considered alert
let cWarnValueUpper = 25; // how much space free is considered warn
let vCountAlert = 0;
let vCountWarn = 0;
let vCountOK = 0;

// boot source count 
let vSourceCount = 0;

// search flag
let vIsDataFiltered = false;

// ui object constants
const oButtonAll = document.getElementById("button-all");
const oCartBoxPopUp = document.getElementById("cartboxPopup");
const oButtonCart = document.getElementById("button-cart");
const oBackLockPlus = document.getElementById("backLockPlus");
const oButtonSearch = document.getElementById("button-search");
const oButtonGlance = document.getElementById("button-glance");

// display witness box
const oPageNumber = document.getElementById("page-number");

// section for button insetion in scrolling page
const oInnerButtons = document.getElementById("activityShow")

// application title
const oTitleAppName = document.getElementById("title-app-name");

// popup box (regular)
const oMsgBoxPopUp = document.getElementById("msgboxPopup");
const oSearchBox = document.getElementById("search-box");

// bottom options
const oButtonGoToTop = document.getElementById("button-gotop");
const oButtonCompact = document.getElementById("button-compact-view");
const oButtonNormal = document.getElementById("button-normal-view");

// functions    ----------------------------------------------------------

function fSaveParameters(setting="show-summary-card", value = vIsSummaryHidden) {
try{
    localStorage.setItem(setting, JSON.stringify(value));
    return true;
} catch {
    return false;
    }
}

function doShowGrid() {
    try {
        doGridBox(doMiniGrid(aImages))
    } catch {
        doPopUp(`Grid view can only be used with more than one item on display.`,true,2000)
    }        
}

function doAppendToCart(){
    aSelected = aSelected.concat(aImages);
    doUpdateCart();
}

function doResetDisplay(){
    aImages = aImagesMirror;
    doAllItems();
    doPopUp(`back to grid view`,true,1500)
}

function doSearch(searchTerm) {
    // reset display
    if (oSearchBox.value == "") {
        return "empty search box"
    }
    aImages = aImagesMirror;
    doAllItems();
    let ix;
    let aFound = [];
    let existString;
    ix = 0;
    while (ix < aImages.length){
        try {
        existString = `${aImages[ix].fqdn} | ${aImages[ix].location} | ${aImages[ix].engine_type}${aImages[ix].associated_seals} | ${aImages[ix].version} | ${aImages[ix].uuid} | ${aImages[ix].placeholder1$} | ${aImages[ix].rsa_enabled}`;
        if (existString.toLowerCase().indexOf((searchTerm.toLowerCase())) > -1){
            aFound.push(aImages[ix]);
        }
        }
        catch {
            //fail silently
        }
        finally {
            ix++;
        }
    }
    
    if (aFound.length < 1) {
        doPopUp(`'${oSearchBox.value}' returned no matches.`, false, 2000);
    } else if (aFound.length == 1) {
        aImages = aFound;
        displayInThumbs(0, 0, true);
        oPageNumber.innerText = `search results for '${oSearchBox.value}'`;
        vIsDataFiltered = true;
    } else {
        aImages = aFound;
        vIsDataFiltered = true;
        doAllItems();
        doPopUp(`'${oSearchBox.value}' returned ${aFound.length} matches.`, true, 3000);
    }
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
                return false;
                //nothing, let it fail silently
            }
        }
        g++;
    }
    return true;            
}    

function doCallAToast(vText="Empty",vDuration=1500,vColorHTML="linear-gradient(to right, #005454, #003030)") {
    try{
        Toastify({
            text: `${vText}`,
            duration: vDuration,
            close: false,
            gravity: "top", // `top` or `bottom`
            position: "left", // `left`, `center` or `right`
            stopOnFocus: false, // Prevents dismissing of toast on hover
            hideProgressBar: true,
            style: {
                fontFamily: "Roboto",
                fontSize: "0.7rem",
                padding: "0.5rem",
                color: "white",
                background: vColorHTML,
            },
        onClick: function(){console.log("Don't click my toasts!")} // Callback after click
        }).showToast();
        return true;
    } catch {
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
            doPopUp(`download started for ${vFileNameDownload}...`, true, 2000);
            return true;
        } catch {
            doPopUp(`download failed for '${vFileNameDownload}'.`);
            return false;
        }
    } else {
        doPopUp("Nothing to export, your cart is empty.");
    }
}

function doMiniGrid(aArrayIn = [], vSpecial = false) {
    let i = 0;
    let outputString = ``;
    let vPercEval = 0;
    let cWindowTitle = `<h2 style="width: 100%;">grid view</h2>`;


    if (vSpecial) {
        cWindowTitle = "";
    }
    
    while (aArrayIn.length > i) {
        //evaluate warinng level
        vPercEval = 100-Math.round((aArrayIn[i].storage_used / aArrayIn[i].storage) * 100);
        
        if (isNaN(vPercEval)) {
            vPercEval = `--`;
        }

        if (vPercEval < cAlertValueUpper) {
            vCSSClass = `flex-no-button-alert-sq`;
        } else if (vPercEval < cWarnValueUpper) {
            vCSSClass = `flex-no-button-warning-sq`;
        } else {
            vCSSClass = `flex-no-button-ok-sq`;
        }
        outputString = `${outputString}<div class="${vCSSClass}" id="server${i}" title="${aArrayIn[i].fqdn}, click for details" onclick="dblClickStuff(${i})">${vPercEval}%<br>${aArrayIn[i].engine_type[0]}</div>`;
        i++;
    }
    let vUnit = Math.round(20 / 7); // 20 rem displays 7 boxes
    let vSqUnit = Math.round(Math.sqrt(aArrayIn.length))
    let rUnit = (vUnit*vSqUnit)
    
    return `${cWindowTitle}<div style="width: ${rUnit}rem; justify-content: space-around; padding: 1.2rem;">${outputString}</div>`;
}

function doPing(){
    // mock function
    doPopUp(`Simulated ping: <p class="reg-text" border-radius: 5px;">${doRandomPing()}ms</p>`,false);
}

function doPopulateButtons(){
    // BUTTON TEXT AND TOOLTIP
    oButtonAll.innerHTML = `refresh`;
    oButtonAll.title = `refreshes this pages from all data sources`;
    oButtonCart.innerHTML = `export (0)`;
    oButtonCart.title = `display the download cart window`;
    oButtonSearch.innerHTML = `search`;
    oButtonSearch.title = `does a search`;
    oPageNumber.innerHTML = `loading...`;
    oTitleAppName.innerHTML = `${vAppTitle}`;
    oButtonGoToTop.innerHTML = `to top`;
    oButtonGoToTop.title = `back to the top of the page`;

    if (localStorage.getItem("sett_viewmode") == "false") {
        oButtonCompact.innerHTML = `compact view`;
        oButtonCompact.title = `toggles the compact view mode`;       
    } else {
        oButtonCompact.innerHTML = `normal view`;
        oButtonCompact.title = `toggles the normal view mode`;
    }

    //BUTTON LISTENERS
    oButtonAll.addEventListener("click", function(){
        //re-request all and sends you back to top
        doBootApp();
    });

    oButtonCart.addEventListener("click", function(){
        doCartBox();
    });

    oButtonSearch.addEventListener("click", function () {
        doSearch(oSearchBox.value);
    });
    oSearchBox.addEventListener("click", function(){
        oSearchBox.value = "";
    });
    oButtonGoToTop.addEventListener("click", function(){
        doResetScroll();
        doCallAToast(`You are back to the top of the list.`, 2500)
    });
    oButtonCompact.addEventListener("click", function(){
        try {
            if (vCompact) {
                vCompact = false;
                oButtonCompact.innerHTML = `compact view`;
                oButtonCompact.title = `toggles the compact view mode`;
                doCallAToast(`Normal view mode active`, 2500, vOKColor)
                localStorage.setItem("sett_viewmode", JSON.stringify(vCompact));    
                doAllItems();
            } else {
                vCompact = true;
                oButtonCompact.innerHTML = `normal view`;
                oButtonCompact.title = `toggles the normal view mode`;
                doCallAToast(`Compact view mode active`, 2500, vOKColor)
                localStorage.setItem("sett_viewmode", JSON.stringify(vCompact));
                doAllItems();    
            }
        } catch {
            oButtonCompact.innerHTML = `normal view`;
            oButtonCompact.title = `toggles the normal view mode`;
            doCallAToast(`Normal view mode active`, 2500, vOKColor)
            localStorage.setItem("sett_viewmode", JSON.stringify(vCompact));    
            doAllItems();        
        }     
    });
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
            vResponse = "./assets/images/engine_gen.png"; // dbhost is not in the icon array, so it uses this one tnat is generic
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
            vNavMessage = `<div class="flex-button" style="width:64px";>
                    items ${(page) * vItemsPerPage} 
                </div>
                <div class="flex-button" style="width:64px";>
                    page ${page + 2}
                </div>`
        }
    }

}

function doResetCounters() {
    vCountAlert = 0;
    vCountWarn = 0;
    vCountOK = 0;
}

function doAllItems(showToast = false) {
    try{
        doResetScroll();
        doResetCounters();
        displayInThumbs();
        if (vIsSummaryHidden) { 
            doHideSummary();
        }
        page = -1 // reset page number to restart the gallery at page 1
        oPageNumber.innerText = `${aImages.length} item(s) displayed`;
        oInnerButtons.innerHTML = `
            <div class="" style="display: inline-block;"> 
                sort by |</div>
            <div class="flex-button" onclick='sortBy("fqdn")' title="sort by fqdn">
                fqdn
            </div>
            <div class="flex-button" onclick='sortBy("space free")' title="sort by free space">
                free space
            </div>
            <div class="flex-button" onclick='sortBy("engine type")' title="sort by engine type" >
                type
            </div>
            <div class="flex-button" onclick='sortBy("storage")' title="sort by size">
                size
            </div>
            <div class="" style="display: inline-block;">
                export |
            </div>
            <div class="flex-button" onclick='addAllItemsToCart()' title="add displayed items to the export cart">
                add all
            </div>
            <div class="" style="display: inline-block;">
                view |
            </div>
            <div class="flex-button" id="button-grid-inner" title="open grid view" onclick="doShowGrid()">
                grid view
            </div>
            `;
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
                break;
            }
            ix++;
        }
        return true;
    }
    catch {
        return false; //return false for testing and stop silently.
    }
    finally{
        if (vFoundFlag) {
            // using toastify to replace some popups
            doCallAToast(`Can't add ${aImages[i].fqdn} to export cart.`,3500,vAlertColor)
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
    // refreshes the contents of the cart
    try {
        oButtonCart.innerHTML = `export (${aSelected.length})`;
        return true;    
    } catch (error) {
        // fail silently and return false for testing
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
        lFirstTime = "yes";
        aSelected = [];
        doUpdateCart()
        return false;
    }
}

function WhatTimeIsIt(vForFile = false){
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

function displayInLowerBox(vTextToPrint){
    //pushes HTML code into the designated box in the index file
    const vBottomText = document.getElementById('bottom-box');
    vBottomText.innerHTML=`${vTextToPrint}`;
}

function doRandomPing() {
    return Math.trunc(Math.floor(Math.random() * 500));
}

function doPopUp(vMsg,vAuto=false,vDelay=950) {
    try {
        oMsgBoxPopUp.style.visibility = "visible";
        oBackLockPlus.style.visibility = "visible";
        let buttonInjector;
        if (vAuto){
            buttonInjector = "";
            setTimeout(doClosePopUp, vDelay);
        }else{
            buttonInjector = `<div id="closeButton" class="flex-button"> close </div>`;
        }
        oMsgBoxPopUp.innerHTML = `<div class="flex-item-msgbox" id="msgOfTheBox"><p class="special-text">${vMsg}</p</div><br><br>${buttonInjector}`;
        if (! vAuto){
            document.getElementById("closeButton").addEventListener("click", function(){
                oMsgBoxPopUp.style.visibility = "hidden";
                oBackLockPlus.style.visibility = "hidden";
            });
        }
    } catch {
        return false;
    }
}

function doSplashScreen(vtype, vMsg, vAuto = true, vDelay = 4000) {
    document.getElementById("msgboxSplash").style.visibility = "visible";
    oBackLockPlus.style.visibility = "visible";
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
            document.getElementById("msgboxSplash").style.visibility = "hidden";
            oBackLockPlus.style.visibility = "hidden";
        });
    }
}


function doCartBox() {
    let i = 0; //start the cart index in the first item of the array
    let itemInjection = ""; // empty local HTML builder
    let lvCSSClass = "flex-item-articles";
    let vButtons;
    if (aSelected.length != 0) {
        while (i < aSelected.length) {
            try {
                vButtons = `<div>
                                <div class="flex-button" style="width: 64px;" onclick="doRemoveFromCart(${i})">
                                    remove
                                </div>
                            </div>
                            <br>`
                itemInjection = `${itemInjection}
                                <div id="cartmyitem${i}";" class=\"${lvCSSClass}\">
                                    <img id="cartthumb${i}" src=\'${getIcon(aSelected[i].engine_type)}\'>
                                    <p class="reg-text" style="width: 100%;  word-wrap: break-word;"><b>${aSelected[i].fqdn}</b>
                                    ${vButtons}
                                </div>`;
                } // build the HTML string
            catch{
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
    oCartBoxPopUp.style.visibility = "visible";
    oCartBoxPopUp.style.width = "85%";
    document.getElementById("backLock").style.visibility = "visible";
    oCartBoxPopUp.innerHTML = `<h2 style="width: 100%;">export.cart</h2>
                                <div class="flex-item-cartbox" id="msgOfTheCartBox"></div>
                                    <div class="flex-item-articles-badges-buttonboard-horizontal">
                                        <br>
                                        <div id="checkoutCart" class="flex-button" style="width:64px;" onclick="doExport(JSON.stringify(aSelected))" title="download cart's data">
                                            download
                                        </div>
                                        <div class="flex-button" style="width:64px;" onclick="doEmptyCart()" title="clear cart's contents">
                                            empty
                                        </div>
                                        <div id="closeButtonCart" style="width:64px;" class="flex-button" title="closes this window">
                                            close
                                        </div>
                                    </div>
                                    ${itemInjection}
                                    <div class="flex-item-cartbox" id="msgOfTheCartBox1">
                                    </div>`;
    const oCartBoxText = document.getElementById("msgOfTheCartBox");
    const oCartBoxText1 = document.getElementById("msgOfTheCartBox1");
    document.getElementById("closeButtonCart").addEventListener("click", function(){
    oCartBoxPopUp.style.visibility = "hidden";
    document.getElementById("backLock").style.visibility = "hidden";
    });
    // top banner
    oCartBoxText.innerHTML = `<p class="reg-text">
                                    You have ${aSelected.length} item(s) in the cart.
                                </p>`;
    // bottom banner
    oCartBoxText1.innerHTML = `<p class="reg-text">
                                    You have ${aSelected.length} item(s) in the cart.
                                </p>`;
}

function doGridBox(gridBoxHTML) {
    oCartBoxPopUp.style.visibility = "visible";
    if (screen.width > 600) {
        oCartBoxPopUp.style.width = "min-content";
    }
    document.getElementById("backLock").style.visibility = "visible";
    oCartBoxPopUp.innerHTML = `${gridBoxHTML}
                                <div class="flex-button" id="closeButtonGrid">
                                    close
                                </div>`;
    document.getElementById("closeButtonGrid").addEventListener("click", function(){
        oCartBoxPopUp.style.width = "90%";
        document.getElementById("backLock").style.visibility = "hidden";
        oCartBoxPopUp.style.visibility = "hidden";
    });
}


function doRemoveFromCart(indexToRemove){
    // removes an item from the selection array based on the index passed
    try {
        aSelected.splice(indexToRemove, 1);      // ix position then length
        return true;
    } catch {
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
        aSelected = []; // empty the array
        doUpdateCart(); // recalculate the contents of the cart
        doPopUp("Your cart is now empty.", true, 1500) // text, automatic dismiss and time to dismiss in ms
        localStorage.setItem("localSavedItems", JSON.stringify(aSelected));             // save the value of the array to lStorage to make it session persistent        }
    }
    doCartBox(); // call the cartbox population function
}

function doClosePopUp(){
    // general reusable function
    // clear the screen from any open popups, used in transitions between screens and boxes
    document.getElementById("msgboxSplash").style.visibility = "hidden";
    oMsgBoxPopUp.style.visibility = "hidden";
    oCartBoxPopUp.style.visibility = "hidden";
    document.getElementById("backLock").style.visibility = "hidden";
    oBackLockPlus.style.visibility = "hidden";
}

function doGoURL(myurl){
    doPopUp(`Opening ${myurl} in new tab...`,true,1000)
    setTimeout(() => {
        window.open(`http://${myurl}`, '_blank')    
    }, 1000);
    
}

function doJoinSources(aArrayToAddTo, aArrayToReadFrom) {
    // joins data from secondary source into the main array and updates the array to display
    let i = 0;
    let r = 0;
    let vFoundFlag = false;
    while (i < aArrayToReadFrom.length) {
        r = 0;
        if (!vFoundFlag) { 
            aArrayToAddTo.push(aArrayToReadFrom[i]);
        }
        vFoundFlag = false;
        while (r < aArrayToAddTo.length) {
            if (aArrayToReadFrom[i].fqdn == aArrayToAddTo[r].fqdn) {
                vFoundFlag = true;
                aArrayToAddTo[r].storage = aArrayToReadFrom[i].storage
                aArrayToAddTo[r].storage_used = aArrayToReadFrom[i].storage_used
                break;
            }
            r++;
        }
        i++;
    }
    return aArrayToAddTo;
}

function displayInThumbs(vStartIdx = 0, vEndIdx = 0, special = false){
    // main gallery rendering funciton, reads all items from a specified index and displays them. 
    // vStartIdx is where to start reading the array, vEndIdx is where to stop reading and special controls if the item needs a big box around or if it is a thumb.
    try{
        /* What 
        Generates the list of servers and displays it in a flexbox container using pre-defined styles, and generating the thumbs based on the JSON data attached at the top of the script 
        */
        const vThumbBox = document.getElementById('thumb-box'); // tell vThumbBox that is a page element
        let vButtonInject; // button injector
        let vExtraInject; // extra info injector
        let returnString = ""; // empty the html building string
        // return button adder
        let vReturnButton = `<div class="flex-button" id="button-return" onclick="doAllItems()">go back</div>`;
        let i=vStartIdx; // initialize my counter with start index
        let vSummaryInject = "";
        let vNoteFlag = ``;

        if (vEndIdx == 0){vEndIdx=aImages.length;}
        if (vEndIdx == 0 ){
            returnString = vThumbBox.innerHTML; // get the current contents of the div to add stuff to
        } else {
            returnString = ``; // empty the return string if the end index is not 0 to clear the gallery page
        }
        // now sweep my array accessing it by index
        // read warning preset value and alert preset value
        while (i < vEndIdx) {
            let vOTFbuttons = `<div class="flex-button" id="button-pingt${i}" onclick="doPing(${i})">
                    ping
                </div>
                <div class="flex-button" id="button-go${i}" onclick="doGoURL('https://${aImages[i].fqdn}')" title="open the server's gui">
                    open
                </div>
                <div class="flex-button" id="button-detail${i}" onclick="dblClickStuff(${i})" title="display the detail card for ${aImages[i].fqdn}">
                    detail
                </div>`;
            let vPercentFree = 100-Math.round((aImages[i].storage_used/aImages[i].storage)*100); // free space is 100-(percentused)
            let vEvalInjector = `<div class="flex-not-button" )" title="installed storage">
                    ${aImages[i].storage}TB
                </div>`; // add the type badge first
            let vAppsBadge = '';
            
            aImages[i].placeholder1 = `${vPercentFree}`;
            // decide alert category and accumulate html
            if (vPercentFree < cAlertValueUpper) {
                vEvalInjector = `${vEvalInjector}
                <div class="flex-no-button-alert" onclick="doPopUp('Free space has fallen blow the critical threshold. The server has only ${vPercentFree}% of storage to use. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">
                    ${vPercentFree}%
                </div>`;
                vCountAlert++;
            } else if ( vPercentFree < cWarnValueUpper) {
                vEvalInjector = `${vEvalInjector}
                    <div class="flex-no-button-warning" onclick="doPopUp('Free space has fallen blow the warning threshold. The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used}TB out of ${aImages[i].storage}TB installed.')">
                        ${vPercentFree}%
                    </div>`;
                vCountWarn++;
            } else {
                vEvalInjector = `${vEvalInjector}
                    <div class="flex-no-button-ok" onclick="doPopUp('The server has ${vPercentFree}% of storage free. <br> Consumed space is ${aImages[i].storage_used} out of ${aImages[i].storage} installed.')">
                        ${vPercentFree}%
                    </div>`;
                vCountOK++;
            }
            if (!special) {
                // injecting buttons for thumb view
                vCSSClass = "flex-item-articles"; // my class to be injected in the dynamically generated html    
                
                if (vCompact) {
                    vButtonInject = ``;
                } else {
                    vButtonInject = `${vOTFbuttons}`;
                }

                vExtraInject = "";
                
                vSummaryInject = `
                    <div id="summary-box-first";" class="flex-item-articles-summary">
                        <div class="flex-item-articles-badges" id="badge-box" style="background-color: ${vSelColor};";>
                        </div>
                        <div id="summary-card-text" class="reg-text" style="width: 95%; height: 100%;">
                            <hr style="border-style: solid; border-width:1px; border-color: ${vSelColor};">    
                            <b>display summary data</b><br>
                            <hr style="border-style: solid; border-width:1px; border-color: ${vSelColor};">
                            <b>server count: </b>${aImages.length} severs <br>
                            <b>overview: </b>${aImages[i].location} last surveyed region<br>
                            <b>last refresh: </b>${WhatTimeIsIt()} local client time<br>
                            <b>is display data filtered: </b>${vIsDataFiltered}<br> 
                            <hr style="border-style: solid; border-width:1px; border-color: ${vSelColor};">
                            <b>data sources: </b>${vSourceCount} sources retrieved<br>
                            <b>src built-in: </b>(ok) ${aImages.length} rows retrieved<br>
                            <b>src storage-be: </b>(ok) ${aStorage.length} rows retrieved<br>
                            <b>src servers-dc2: </b>(ok) ${aServersNDC.length} rows retrieved<br>
                            <b>src mid count: </b>${vCountWarn} servers with mid level messages.<br>
                            <b>src low count: </b>${vCountAlert} servers with low space messages.<br>
                        </div>
                        <div class="flex-item-articles-badges-buttonboard" style="width: min-content;">
                            <div class="flex-no-button-alert" id="summary_alert" title="servers with alerts">
                                at ${vCountAlert}
                            </div>
                            <div class="flex-no-button-warning" id="summary_warning" title="servers with warnings">
                                wn ${vCountWarn}
                            </div>
                            <div class="flex-no-button-ok" id="summary_ok" title="servers with no reported issues">
                                ok ${vCountOK}
                            </div>
                        </div>
                        <div class="flex-item-articles-badges-buttonboard" style="width: min-content;">
                            <div class="flex-button" id="button-refresh-inner" title="refreshes the page by reloading all sources" onclick="doBootApp()">
                                refresh
                            </div>
                            <div class="flex-button" id="button-hide-inner" title="hides this summary card" onclick="doHideSummary()">
                                hide
                            </div> 
                        </div>

                    </div>`;
                
            } else {
                oInnerButtons.innerHTML=`${vReturnButton}`
                vCSSClass = "flex-item-articles-half-width"; // my other class, used only for special objects
                vButtonInject = `${vOTFbuttons}`;
                vExtraInject = `<br><b>serial: </b>${aImages[i].uuid}<br><b>storage total: </b>${aImages[i].storage}TB<br><b>storage used: </b>${aImages[i].storage_used}TB<br><b>rsa: </b>${aImages[i].rsa_enabled}`;
                vSummaryInject = "";
            }
            // check if the server has apps   
            if (aImages[i].associated_seals != 'vacant' && aImages[i].associated_seals != "" ){
                vAppsBadge = `<img id="appbadge${i}" src='./assets/images/engine_app.png' title="associated SEALs: ${aImages[i].associated_seals}"} style="width: 20px; height: 20px;">`;
            }
            
            // check if the server has apps   
            if (aImages[i].rsa_enabled.toLowerCase() === "false") {
                vNoteFlag = ``;
            } else {
                vNoteFlag = `<img id="rsabadge${i}" src='./assets/images/engine_trm_2.png' style="width: 20px; height: 20px;" title="RSA enabled: ${aImages[i].rsa_enabled.toLowerCase()}">`;
            }

            // accumulate the generated html in the variable
            returnString = `${returnString}
                <div id="myitem${i}";" class=\"${vCSSClass}\">
                    <div class="flex-item-articles-badges id="badges${i}">
                        <img id="thumb${i}" src=\'${getIcon(aImages[i].engine_type)}\' onclick="dblClickStuff(${i})" alt=${aImages[i].fqdn}>
                        ${vAppsBadge}
                        ${vNoteFlag}
                    </div>
                    <div class="reg-text" style="width: 100%; height: 100%;">
                        <b>${aImages[i].fqdn}</b><br>
                        <hr style="border-color: ${vSelColor}; border-style: solid; border-width: 1px; width: 80%;">
                        <b>type: </b>${aImages[i].engine_type}<br>
                        <b>site: </b>${aImages[i].location}<br>
                        <b>version: </b>${aImages[i].version}<br>
                        <hr style="border-color: ${vSelColor}; border-style: solid; border-width: 1px; width: 80%;">
                        <b>app ids: </b>${aImages[i].associated_seals}${vExtraInject}<br>
                    </div>
                    <div class="flex-item-articles-badges-buttonboard">${vEvalInjector}${vButtonInject}
                        <div class="flex-button" id="button-add-${i}" onclick="addItem(${i})" title="add this item to the export cart">
                            add
                        </div>
                    </div>
                </div>`; // build the HTML string
            i++; // increment for next idx
        }
        // dump the variable contents as the HTML face of the vThumbBox element.
        vThumbBox.innerHTML = `${vSummaryInject}${returnString}`;
        return true;
    }
    catch{ // if there is an error just say it in console and carry on
        //fail silently and return false in test
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

function doHideSummary() {
    
        vIsSummaryHidden = true;
        fSaveParameters()
        document.getElementById('summary-box-first').remove();
        return true;        
    
}

function dblClickStuff(vItemIndex){
    doClosePopUp();
    oPageNumber.innerHTML = `item: ${vItemIndex}`;
    displayInThumbs(vItemIndex, vItemIndex+1, true); // builds the thumbs     
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

    // load saved settings for view
    if (localStorage.getItem("sett_viewmode") != "false") {
        vCompact = true;
    }

    fetch(url_storage).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Can't read from ${url_storage}`);
    })
    .then((responseJson) => {
        aStorage = [...responseJson];
        vSourceCount++;
    })    
    .catch((_error) => {
        doPopUp(`Error: Can't read ${url_storage}.`);
    });

    fetch(url_ndc).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Can't read from ${url_ndc}`);
    })
    .then((responseJson) => {
        aServersNDC = [...responseJson];
        vSourceCount++;
    })    
    .catch((_error) => {
        doPopUp(`Error: Can't read ${url_ndc}.`);
    });

    fetch(url).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Can't read from ${url}`);
    })
    .then((responseJson) => {
        aImages = [...responseJson];
            if (lFirstTime == "yes"){
                doSplashScreen(`Starting ${vAppTitle}`, `Saving initialization data.`, true)
                localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
            }else{
                doSplashScreen(`${vAppTitle.toLowerCase()}, loading...`, "", true);
                
            }
        aImages = doJoinSources(aImages, aStorage);  
        aImages = doJoinSources(aImages, aServersNDC);  
        aImagesMirror = aImages;
        vSourceCount++;
    })
    
    .catch((_error) => {
        doPopUp(`Error: Can't read data from ${url}. Retrying...`,true,10000);
        //recursive call to self to catch boot load failure
        setTimeout(() => {
            doPreBoot();    
        }, vTimeOut);
    });
}

function doBootApp(){
    // call preloading async routine
    vCountAlert = 0;
    vCountWarn = 0;
    vCountOK = 0;
    vSourceCount = 0;
    doPreBoot();
    oSearchBox.value = "";
    //wait for it...
    setTimeout(() => {
        //bootstraping routine
        // fetch my data sources in under vDelay ms
        windowTitle.innerText = `${vAppTitle}`;
        doRecoverSavedItems(); // read localStorage saved data
        sortBy('space free'); // sort and boot
        // POP UP ACTION FOR THE FIRST TIME VISIT OF THE PAGE
        // this needs to happen after the page is rendered
        if (aSelected == null){
            aSelected = [];
            localStorage.setItem("localSavedItems", JSON.stringify(aSelected));
        }
        doClosePopUp();
        // start the ping simulator once page loaded or failed
        setInterval(doMockPing, 1000);
    }, vTimeOut);
    return true;
}

// main code ----------------------------------------------------------
// here goes the code for calling the rendering functions
//KEY LISTENERS

doPopulateButtons();

document.addEventListener('keydown', (event) => {
    let name = event.key;
    if (name == "Escape"){
        doClosePopUp();
    }
}, false);

document.addEventListener('keyup', (event) => {
    let name = event.key;
    if (name == "Enter"){
        doSearch(oSearchBox.value);
    }
}, false);

//COLD BOOT VARIABLE SET
let aImages = [];
let aStorage = [];
let aServersNDC = [];
let aImagesMirror = [];

doBootApp(); //BOOT APP

// only non-fetch data dependent actions on data can be executed from this point on.
// merged from main station