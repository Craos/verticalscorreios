var Webservice = function (target) {

    var _ws = '../../ws/';
    if (target !== undefined)
        _ws = target;

    /**
     *
     * @param parametros
     * @returns {string}
     */
    var setParameters = function (parametros) {
        var result = '';
        for (var key in parametros)
            if (parametros.hasOwnProperty(key))
                result += key + '=' + parametros[key] + '&';

        return _ws + '?p=0&' + result.substring(0, result.length - 1);
    };


    /**
     *
     * @param data
     * @param callback
     * @constructor
     */
    this.Request = function (data, callback) {

        var xhr = new XMLHttpRequest();
        xhr.open('POST', _ws, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr);
            } else if (xhr.status !== 200 && xhr.status !== 304) {
                callback(false);
            }
        };
        xhr.send(setParameters(data));
    }
};