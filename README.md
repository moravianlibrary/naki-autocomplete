# NAKI Autocomplete
This tool can be used to build autocomplete on top of external search services. The external service needs to support [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing). NAKI Autocomplete is available as jQuery plugin.

Example of usage could be seen in [demo.html](demo.html) file.

Basically you need to add this to your html/templates:
```html
<html>
<head>
    <link rel="stylesheet" href="autocomplete.css">
</head>
<body>
<!-- You content here -->
    <form id="demo" method="get" action="https://www.knihovny.cz/Search/Results" autocomplete="off">
        <label for"lookfor">Search for:</label>
        <input id="lookfor" name="lookfor">
        <button type="submit">Search</button>
    </form>
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
    <script src="autocomplete.js"></script>
    <script src="autocomplete-knihovny-cz.js"></script>
    <script>
    $("#demo #lookfor").autocomplete({
        maxResults: 5,
        cache: false,
        loadingString: 'Nahrávám...',
        handler: knihovnyCz
    });
    </script>    
</body>
</html>
```

## Customizing your autocomplete
### Changing style

There are several classes you can use to customize look and feel of your autocomplete. Example of usage could be found in the  [autocomplete.css](autocomplete.css) file.
- `autocomplete-results` - whole autocomplete container
- `autocomplete-results-category` - heading of every section
- `item` - each suggested item
- `loading` - placeholder when loading result from external service
- `selected` - currently selected item in autocomplete

### Changing behaviour

You can change the behaviour of NAKI Autocomplete by passing options to a contructor. Available options are (formatted as `key`:default value):   
```json
timeout: 200, // ajax timeout
cache: true,
highlight: true,
loadingString: 'Loading...',
maxResults: 15,
minLength: 3,
language: 'cs',
autoSubmit: true,
handler: copyHandler 
```
    
## Configuring data source
Not all search services return the data for autocomplete in the same format. In such situation a handler comes into play.
Handler is a piece of code which handles data from an external source and parses it to a format suitable for NAKI Autocomplete.
There are several requirements that the handler needs to meet:
- needs to add `ajax` function of the autocomplete object
- needs to modify data into a required format (see bellow)
- needs to call callback function with the data as a parameter

The handler function is called with three parameters:
1. `autocomplete` - an instance of autocomplete prototype
2. `query` - value for which we want suggestions
3. `callback` - callback function

The data should be formatted as follows:
```json
[
    {
        'section_name': "Heading for particular section",
        'items': [
            {
                'value': "some value",
                'label': "some label"
            },
            ... more items ...
        ]
    },
    ... more sections ...        
]
```

Alternatively, `items` can be an array of string; the string is then used as both, `label` and `value`.

So, a basic handler could look like this:
```javascript
function copyHandler(autocomplete, query, callback) {
    autocomplete.ajax({
        url: 'https://search.example.com',
        data: {
            q:query,
            some_param: 'some value',
        },
        dataType: 'json',
        success: function(json) {
            if (json !== 'undefined') {
                callback(data);
            } else {
                callback([]);
            }
        }
    });
}
```

Another example of a handle could be found in [autocomplete-knihovny-cz.js](autocomplete-knihovny-cz.js) file which is a handler for using NAKI Autocomplete on top of the autocomplete from [Knihovny.cz](https://www.knihovny.cz) portal.
