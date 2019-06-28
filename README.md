## Goal: 

To implement instant search

## Design:

These are some of the highlights of the design

0. There is a simple check/validation of input search string. This is done to avoid unnecessary server calls. This function can always be expanded to accomodate more search input criterias.

```
function isSearchInputValid(searchString) {
    // do search string validation here
   
    // check for null or undefined or empty string
    if (!searchString) {
        return false;
    }

    return true;
}
```

1. I have used a debounce for the search API request. The interval is 500ms. This invokes the
doSearch handler for keyup Press only after 500ms have passed by without user key. This helps with not seeing un-needed search API requests for every key press.

```
searchElement.addEventListener("keyup", _.debounce(doSearch, debounceInterval))

```

2. I have used grid for layout of the search results. To make sure that the grid is responsive across most devices, I have used the following css style

```grid-template-columns: repeat(auto-fill, minmax(22vh, 1fr));
grid-template-rows: repeat(auto-fill, minmax(34vh, 1fr));
```

Although, I could have used media queries too in my css, I did not do it for this assignment

```* for mobile  */
     @media (min-width:20em) {
        .searchResults {
            grid-template-columns: repeat(1, minmax(22vh, 1fr));
            grid-template-rows: repeat(auto-fill, minmax(34vh, 1fr));
        }
    }
```

3. To be mindful of server load, I have implemented cache to store both search results and details of assets the user clicks. Please be aware that this is a naive FIFO queue cache and this can be a seperate new project by itself w.r.t cache cleanup etc. For now, I have assumed max length of both caches as 10

```// max length of search and details cache
// this is configurable
const MAX_SEARCH_CACHE_LENGTH = 10;
const MAX_DETAILS_CACHE_LENGTH = 10;

// Cache for both search and details
var searchCache = [];
var detailsCache = [];
```

4. I have also used a default image for search results in case the poster is not available. Also, I have made use of onLoad() method to load the corresponding poster asynchronously giving a good transition from default to the valid poster for the result.

```image.src = defaultPoster;

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
```

5. When the user taps on a search result, the details element shows up. 
   I only have one detailsSection whose content and position keeps changing based on
   which result cell user taps or does mouseover on.
   In CSS, position: absolute ensures that the position of the details element is positioned 
   relative to the grid cell that users taps on
   
   ```
    section.searchResults > .result {
        position: relative;
        width: 22vh;
        height: 32vh;
        padding: 1em;
        text-align: center;
        border: 0.05em solid black;
    }


    section.details {
        background-color: beige;
        color: black;
        position: absolute;
        top: 5vh;
        left: 27vh;
        z-index: 2;
        width: 28vh;
        height: 28vh;
        border: 0.05em solid black;
        border-radius: 2vh;
    }
    ```
6. I have captured mouseenter and mouseleave events for the parent result Grid rather than individual search results/cells. I have done this by making use of useCapture = true and event.target as indicated below

```
resultsGrid.addEventListener("mouseenter", handleMouseEnter, true)

resultsGrid.addEventListener("mouseleave", handleMoveAway, true);
```

7. I have verified that the search page behaves as expected on 2ft desktop/browser, 1ft and 2ft devices using Chrome Developer Tools device simulation. On 1ft and 2ft, one needs to tap to see the details of a result cell.

8. As I have mentioned above, that I have verified that it works as expected on Chrome. As for the other browsers:

### Firefox: 2ft browser works good. On 1ft and 2ft devices, although the search results come up fine and UI is responsive, the details panel that comes up upon taping the results is slow to come up

### Safari: It seems like none of my script tags are loading in Safari. Developer tools shows me that there was an error loading all the  tags below. I will have to investigate further.

```
  <script type="text/javascript" src="../libs/lodash.js"></script>
  <link rel="stylesheet" href="../css/instantSearch.css">
  <script type="text/javascript" src="../js/instantSearch.js"></script>
  ```
