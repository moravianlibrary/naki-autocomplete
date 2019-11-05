function knihovnyCz(autocomplete, query, callback) {
    autocomplete.ajax({
        url: 'https://www.knihovny.cz/AJAX/JSON',
        data: {
            q:query,
            filters: 'null',
            method: 'getACSuggestions',
        },
        dataType: 'json',
        success: function(json) {
            if (json.status == 'OK' && typeof json.data !== 'undefined') {
                var data = (function (data) {
                    var newData = [];
                    if (data.byTitle.length > 0) {
                        newData.push({
                            section_name: "Podle názvu",
                            items: data.byTitle
                        });
                    };
                    if (data.byAuthor.length > 0) {
                        newData.push({
                            section_name: "Podle autora",
                            items: data.byAuthor
                        });
                    };
                    if (data.byAuthor.length > 0) {
                        newData.push({
                            section_name: "Podle tématu",
                            items: data.bySubject
                        });
                    };
                    return newData;
                })(json.data);
                callback(data);
            } else {
                callback([]);
            }
        }
    });
}
