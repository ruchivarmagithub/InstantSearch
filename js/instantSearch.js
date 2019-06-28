// debounce interval is configurable
// debounced handler will be invoked if 500ms have passed by
// after the last user keyup event
const debounceInterval = 500;
const apiUrl = "http://www.omdbapi.com/?apikey=aba065d3";
const defaultPoster = "../defaults/defaultPoster.gif";

// max length of search and details cache
// this is configurable
const MAX_SEARCH_CACHE_LENGTH = 10;
const MAX_DETAILS_CACHE_LENGTH = 10;

// Cache for both search and details
var searchCache = [];
var detailsCache = [];

function isSearchInputValid(searchElement) {
    var minSearchLength = searchElement.getAttribute("minlength");
    var searchString = searchElement.value;

    // do search string validation here
   
    // check for null or undefined or empty string
    if (!searchString) {
        return false;
    }

    // check for minlength for search input
    if (searchString.length < minSearchLength) {
        return false;
    }

    return true;
}

function isSearchCacheFull() {
    return searchCache.length === MAX_SEARCH_CACHE_LENGTH ? true : false;
}

function isDetailsCacheFull() {
    return detailsCache.length === MAX_DETAILS_CACHE_LENGTH ? true : false;
}

// this invokes search OMDB API
function doSearch() {
    // check for valid search string
    var searchElement = document.getElementById("searchBox");
    var minLength = searchElement.getAttribute("minlength");
   
    var searchString = searchElement.value;

    if (!isSearchInputValid(searchElement)) {
        showErrorMessage(`Invalid values: empty string, null, undefined or less than ${minLength}`, "resultsGrid");
        return;
    }

    // cleanup grid before displaying new search results
    clearSearchGrid();

    // lookup search cache to save server request
    var index = searchCache.map(s => s.searchStr).indexOf(searchString);
    if (index != -1) {
        // cache HIT
        // retrieve data from cache
        var searchResults = searchCache[index];

        showSearchResults(searchResults, searchString, false);
    } else {
        // cache MISS
        // call Search API
        var searchUrl = apiUrl + "&s=" + searchString;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    showSearchResults(JSON.parse(xhr.response), searchString, true);
                } else {
                    showErrorMessage(`Error returning results. Server returned: ${xhr.status}`, "resultsGrid");
                }
            }
        }
        xhr.ontimeout = function () {
            showErrorMessage(`XHR timeout. Server request timed out`, "resultsGrid");
        }
        xhr.open('get', searchUrl, true)
        xhr.send();
    }
}

// mouseenter and mouseleave handlers
function handleMoveAway(event) {
    // remove details element
    // wipe off contents of details section
    var detailsSection = document.getElementById("itemDetails");

    detailsSection.innerHTML = "";

    // hide details section
    detailsSection.classList.add("displayNone");

    return false;
};

function handleMouseEnter(event) {
    // only handle events from the grid cells
    if (event.target.className === "result") {
        // fetch from server 
        // event.target.id contains the id of the grid cell that invoked the event
        fetchDetails(event.target, event.target.id);
    }

    return false;
};

// process Search results and show them on the grid
function showSearchResults(results, searchString, storeInCache) {
    // for each search result, process it
    // and add to the resultsGrid
    const responseStatus = results.Response;

    if (responseStatus.toLowerCase() === "false") {
        console.log("Error. Something went wrong!");

        // oops something happened!
        showErrorMessage(results.Error, "resultsGrid");

        // dont store this result in cache
        storeInCache = false;
    } else {
        // process results
        var searchResults = results.Search;

        // for cases where the XHR response status is 200 but the Search Results returned are undefined, 
        // we dont want to store in cache
        if (!searchResults) {
            storeInCache = false;
        }

        var resultsGrid = document.getElementById("resultsGrid");

        // create event listeners at the parent level
        // set useCapture to true so that mouseenter and mouseleave events for the grid cells are captured by the parent grid
        resultsGrid.addEventListener("mouseenter", handleMouseEnter, true)

        // add mouseleave handler
        resultsGrid.addEventListener("mouseleave", handleMoveAway, true);

        // for each result,
        // 1. create image element 
        // 2, create 2 div elements for title and type
        for (let i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];

            // create result cell
            var resultDiv = document.createElement("div");
            resultDiv.className = "result";

            // set the id of the result cell to the imdbID
            resultDiv.id = result.imdbID;

            // add image element
            var image = document.createElement("img");

            // show default image until poster is downloaded
            image.src = defaultPoster;

            // download the new image iff there is a valid poster url
            if (result.Poster != "N/A") {
                var downloadingImage = new Image();

                downloadingImage.onload = (function (img) {
                    return function() {
                        console.log("inside onload " + this.src)
                        img.src = this.src;
                    }
                })(image);

                downloadingImage.src = result.Poster;
            }

            resultDiv.appendChild(image);

            // create metadata for title and type
            var titleMetadata = document.createElement("div");
            titleMetadata.className = "metadata";
            titleMetadata.innerText = result.Title;

            var typeMetadata = document.createElement("div");
            typeMetadata.className = "metadata";
            typeMetadata.innerText = result.Type;

            resultDiv.appendChild(titleMetadata);
            resultDiv.appendChild(typeMetadata);
            
            // append result to searchResults Grid
            resultsGrid.append(resultDiv);
        }
    }

    // create cache for this search string
    if (storeInCache) {
        // check if cache is full or not
        if (isSearchCacheFull()) {
            // cache is full
            // remove the front-most cache entry
            searchCache.shift();
        }

        // add to cache
        searchCache.push({
            searchStr: searchString,
            Search: searchResults,
            Response: "True"
        });
    }
}

// invoked before every new search results redraw
function clearSearchGrid() {
    // save details section element
    // attach it to the parent of resultsGrid before clearing results grid
    var results = document.getElementById("resultsGrid");
    var detailsSection = document.getElementById("itemDetails");

    results.parentNode.appendChild(detailsSection);

    detailsSection.innerHTML = "";

    detailsSection.classList.add("displayNone");

    // clean up event listeners for grid
    resultsGrid.removeEventListener("mouseenter", handleMouseEnter, true);
    resultsGrid.removeEventListener("mouseLeave", handleMoveAway, true);

    results.innerHTML = ""; 
}

// generic handler for showing error message
function showErrorMessage(msg, elementId) {
     // clear grid to show error message
    clearSearchGrid();

    var element = document.getElementById(elementId);
    var paragraph = document.createElement("p");

    // prepare error message
    paragraph.innerHTML = `<span>${msg}</span>`;

    // append error message element
    element.append(paragraph);
}

// function that display's additional details when user mouseover/taps on a search result
function showDetails(parentElement, details, assetId, storeInCache) {
    const responseStatus = details.Response;

    // if the response status from server is false or something went wrong and details is null 
    // then show error message on the details element
    if (responseStatus.toLowerCase() === "false" || !details) {
        console.log("Error. Something went wrong!");

        showErrorMessage(`Error. Something went wrong!`, "itemDetails");

        // we dont want to store this in cache
        storeInCache = false;
    } else {
        // add asset details to the details element 

        // get section for details
        var detailsSection = document.getElementById("itemDetails");

        var paragraph = document.createElement("p");

        // process details
        const title = details.Title;
        const year = details.Year;
        const director = details.Director;
        const ratings = details.Ratings;

        paragraph.innerText = `
        ${title ? `Title: ${title}` : ``}
        ${year ? `Year: ${year}` : ``}
        ${director != "N/A" ? `Director: ${director}` : ``}
        ${ratings.length > 0 ? `RatingSystem: ${ratings[0].Source}` : ``}
        ${ratings.length > 0 ? `Rating: ${ratings[0].Value}` : ``}`;

        // append paragraph to detailsSection
        detailsSection.appendChild(paragraph);

        // create cache for details
        if (storeInCache) {
            // check if cache is full or not
            if (isDetailsCacheFull()) {
                // cache is full
                // remove the front-most cache entry
                detailsCache.shift();
            }

            // add to cache
            detailsCache.push({
                id: assetId,
                Title: title,
                Year: year,
                Director: director,
                Ratings: ratings,
                Response: "True"
            });
        }

        // attach details section to the result (parent) that the user hovered on
        parentElement.appendChild(detailsSection);

        // make it visible
        detailsSection.classList.remove("displayNone");
    }
}

// fetch details for the asset which user has hovered on
function fetchDetails(element, assetId) {
    // lookup the cache before going to server
    var index = detailsCache.map(s => s.id).indexOf(assetId);

    if (index != -1) {
        // cache HIT
        // retrieve data from cache
        var details = detailsCache[index];

        showDetails(element, details, assetId, false);
    } else {
        // cache MISS
        // call Title API
        var searchUrl = apiUrl + "&i=" + assetId;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    showDetails(element, JSON.parse(xhr.response), assetId, true);
                } else {
                    console.log("error returning results");

                    // show error message on the details element
                    showDetails(element, null, assetId, false);
                }
            }
        }
        xhr.ontimeout = function () {
            console.log('xhr timeout')

            // show error message on the details element
            showDetails(element, null, assetId, false);
        }
        xhr.open('get', searchUrl, true)
        xhr.send();
    }
}

(function initializeSearch() {
    var searchElement = document.getElementById("searchBox");

    searchElement.addEventListener("keyup",  _.debounce(doSearch, debounceInterval));
    
})()    // IIFE: this gets invoked by default