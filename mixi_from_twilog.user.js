// ==UserScript==
// @name          mixi from twilog
// @namespace     http://github.com/lolicsystem
// @description   mixi from twilog
// @include       http://mixi.jp/add_diary.pl*
// @author        Chiemimaru Kai (lolicsystem)
// @version       0.4.1
// ==/UserScript==

(function () {

    // Set your twitter name.
    //
    // var twitter_name = 'yourtwittername';
    var twitter_name = '';      // <== set your twitter name !!!

    // Make yesterday string
    //
    function yesterday() {
        var uYear, uMon, uDate;
        var nt = new Date();
        nt.setTime(nt.getTime() - 86400000);

        uYear = ("00" + (nt.getYear() - 100).toString()).slice(-2);
        uMon  = ("00" + (nt.getMonth() + 1).toString()).slice(-2);
        uDate = ("00" + nt.getDate() .toString()).slice(-2);
        var uYesterday = uYear + uMon + uDate;
        return uYesterday;
    }

    // Make twilog URL
    //
    function twilog_url() {
        var url;
        url = "http://twilog.org/" + twitter_name +
              "/date-" + yesterday() + "/asc-nomen";
        return url;
    }

    // cho45's $X (http://lowreal.net/logs/2006/03/16/1)
    //
    $X = function (exp, context) {
        if (!context) context = document;
        var resolver = function (prefix) {
            var o = document.createNSResolver(context)(prefix);
            return o ? o : (document.contentType == "text/html") ? "" : "http://www.w3.org/1999/xhtml";
        }
        var exp = document.createExpression(exp, resolver);

        var result = exp.evaluate(context, XPathResult.ANY_TYPE, null);
        switch (result.resultType) {
        case XPathResult.STRING_TYPE : return result.stringValue;
        case XPathResult.NUMBER_TYPE : return result.numberValue;
        case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: {
            result = exp.evaluate(context, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            var ret = [];
            for (var i = 0, len = result.snapshotLength; i < len ; i++) {
                ret.push(result.snapshotItem(i));
            }
            return ret;
        }
        }
        return null;
    }

    // Get twitter log from twilog.
    //
    function get_twilog() {
        var twilog_text;
        GM_xmlhttpRequest({
            method : "GET",
            url    : twilog_url(),
            onload : function(r) {
                if (r.status == 200) {
                    twilog_text = reformat_twilog(r.responseText);
                } else {
                    twilog_text = {title:'', text:''};
                }
                insert_twilog(twilog_text);
            }
        });
        return ;
    }

    // reformat twilog source
    //
    function reformat_twilog(source) {
        var text = '';
        var LF = String.fromCharCode(10); // 改行コード (LF)
        var d = document.createElement('div');
        d.innerHTML = source;
        var ti = $X(".//h3[@class='bar-main2']", d)[0]
                 .innerHTML.split(LF)[0]
                 .replace(/ */gi, '') + ' のつぶやき';
        var t = $X(".//p[@class='tl-text']", d);
        var p = $X(".//p[@class='tl-posted']/a", d);
        for (var i = 0; i < t.length; i++) {
            text = text +
                   p[i].innerHTML + '\n' +
                   t[i].innerHTML.replace(/<\/?[^>]+>/gi, '') + '\n\n';
        }
        text = text +
            '--------\n' +
            '※ Powered by "mixi_from_twilog.user.js" !!\n' +
            '　 (http://github.com/lolicsystem/mixi_from_twilog)';

        return {title:ti, text:text};
    }

    // Insert log into textarea.
    //
    function insert_twilog(text) {
        var ti = $X("//input[@class='editareaWidth']")[0];
        var ta = $X("//textarea[@id='diaryBody']")[0];
        ti.value = ti.value + text.title;
        ta.value = ta.value + text.text;
    }

    // Create twitter icon image
    //
    function twitter_img() {
        var img = document.createElement('img');
        var data = 'data:image/gif;base64,'+
            'R0lGODlhFgAWAMQAAHXV%2FNf0%2F%2FX09eb4%2F4ba%2Fdvb3GzS%2FMjIyajm'+
            '%2F%2Brp6fHx8eLi4%2Fj4%2BNLR0%2FP8%2F%2FHu7rzs%2Fv78%2B%2Fz6%2Bf'+
            'v39%2BDf4fn9%2F8vLy%2Fn5%2Bfv7%2B%2B7u7v39%2Fe%2Fv7%2Fr6%2Bvz8%2'+
            'FP%2F%2F%2F8zMzCH5BAAAAAAALAAAAAAWABYAAAX%2FoPdZZGlaX6qm4qK9cCy%'+
            '2F3pJiXa7vfP7eusQiQcz0fJoRB4PJPDyDgafArFZ%2FnwuHQ9FAAICAgMJRKLbb'+
            'XErLKXAQBgNE8xAIHolMurO%2BXAoXcAYIUQFRHhQKF0wpHAwMgHBgk2ABEwUMW4'+
            '1bkQYAcZ5xCBgNaH1%2FgZ4ABKurlg1%2BFymPkKmDDgO4DhIHCbSzj51yHsTEHx'+
            'S0DCkCDAIFEoIEAxUOFRUSFMzMy3YUEwGqBOLiA5d2Atx2BR6CoKKk5ylmCmMZXq'+
            'yUEBEf8%2FJmdg0WeHAQoKAhDw0SmfFHz86CAxAjQmwgoN%2BHDRgzaty4MUWBDC'+
            'BDihwZssAHEStSBapc4SEEADs%3D';
        img.src = data;
        img.width = 22;
        img.height = 22;
        return img;
    }

    // Create anchor
    //
    function twitter_a() {
        var a = document.createElement('a');
        a.title = 'twilog挿入';
        a.href = 'javascript:void(0);';
        a.appendChild(twitter_img());
        return a;
    }

    // Add twitter icon to the page
    //
    var target = $X("//div[@class='txtEditArea']")[0];
    var a = twitter_a();
    a.addEventListener('click',
                       function () {
                           get_twilog();
                       },
                       false);
    target.insertBefore(a, target.firstChild);
})();
