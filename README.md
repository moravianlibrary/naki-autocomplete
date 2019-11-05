# NAKI autocomplete
This library can be used to build autocomplete on top of external search services. That external service needs to support [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing). This library is available as jQuery plugin.

Example of usage could be seen in file [demo.html](demo.html).

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
### Change style

There are several classes you can use to customize look and feel of your autocomplete. Example of usage could be find in file [autocomplete.css](autocomplete.css).
- `autocomplete-results` - whole autocomplete container
- `autocomplete-results-category` - heading of every section
- `item` - each suggested item
- `loading` - placeholder when loading result from external service
- `selected` - currently selected item in autocomplete

### Change behaviour

You can change some behaviour by passing options to contructor. Available options are (formatted as `key`:default value):   
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
Not all search service does return the data for autocomplete in same format. This is the situation, when handler come into play.
Handler is a piece of code which does handle data from external source and parses it to format for using in autocomplete library.
There are several requirement that the handler needs to meet:
- needs to add `ajax` function of autocomplete object
- needs to modify data into required format (see bellow)
- needs to call callback function with data as parameter

The handler function is called with three parameters:
1. `autocomplete` - an instance of autocomplete prototype
2. `query` - value for which we want suggestions
3. `callback` - callback function

Data should be formatted as follows:
```json
[
    {
        'section_name': "Heading for particular section":
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

Alternatively, `items` could be array of string, the string is the used as both, `label` and `value`.

So, basic handler could look like this:
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

Another example of a handle could be find in file [autocomplete-knihovny-cz.js](autocomplete-knihovny-cz.js) which is handler for using on top of autocomplete from [Knihovny.cz](https://www.knihovny.cz) portal.
