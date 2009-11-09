// ==UserScript==
// @name          mixi from twilog
// @namespace     http://github.com/lolicsystem
// @description   mixi from twilog
// @include       http://mixi.jp/add_diary.pl*
// @author        Chiemimaru Kai (lolicsystem)
// @version       0.8
// ==/UserScript==

(function () {

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

    // Factory to make 6 digits date string
    //
    function createDateString() {
        var nt = new Date();
        var now = nt.getTime();
        return function (offset) {
            var uYear, uMon, uDate;
            nt.setTime(now + offset * 86400000);
            uYear = ("00" + (nt.getYear()  - 100).toString()).slice(-2);
            uMon  = ("00" + (nt.getMonth() +   1).toString()).slice(-2);
            uDate = ("00" +  nt.getDate()        .toString()).slice(-2);
            var uDate = uYear + uMon + uDate;
            return uDate;
        }
    }
    var dateString = createDateString();

    // Icon position
    //
    var iconPos = GM_getValue("position", "0");
    GM_setValue("position", iconPos);

    // Insert/Overwrite mode
    //
    var overwriteMode = GM_getValue("overwrite", true);
    GM_setValue("overwrite", overwriteMode);

    // Add twitter icon and input fields to the page
    //
    var an = twitterAnchor();
    var tn = tnameInput();
    var da = dateInput();

    var target1 = $X("//div[@class='txtEditArea']")[0];
    var target2 = $X("id('emoji_palette')")[0];
    var target3 = $X("id('diaryBody')")[0];
    switch (iconPos) {
    case "1":
        target1.insertBefore(an, target3);
        target1.insertBefore(tn, target3);
        target1.insertBefore(da, target3);
        break;
    case "2":
        target1.appendChild(an);
        target1.appendChild(tn);
        target1.appendChild(da);
        break;
    default:
        target1.insertBefore(an, target2);
        target1.insertBefore(tn, target2);
        target1.insertBefore(da, target2);
        break;
    }

    // Create anchor
    //
    function twitterAnchor() {
        var e = document.createElement('a');
        e.title = 'twilog挿入';
        e.href = 'javascript:void(0);';
        e.appendChild(twitterImg());
        e.addEventListener('click',
                           function () {
                               getTwilog();
                           },
                           false);
        return e;
    }

    // Create twitter icon image
    //
    function twitterImg() {
        var e = document.createElement('img');
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
        e.src = data;
        e.width = 22;
        e.height = 22;
        return e;
    }

    // Create input field (twitter name)
    //
    function tnameInput() {
        var e = document.createElement('input');
        e.type = 'text';
        e.size = '12';
        e.style.cssText = 'margin-top: 1px;' +
                          'margin-left: 5px;' +
                          'display: table-cell;' +
                          'vertical-align: top;';
        e.value = GM_getValue("twitter_name", "");
        return e;
    }

    // Create input field (date)
    //
    function dateInput() {
        var e = document.createElement('input');
        e.type = 'text';
        e.size = '6';
        e.style.cssText = 'margin-top: 1px;' +
                          'margin-left: 5px;' +
                          'display: table-cell;' +
                          'vertical-align: top;';
        e.value = dateString(-1);       // yesterday
        return e;
    }

    // Get twitter log from twilog.
    // (Event-listener for "t" button)
    //
    function getTwilog() {
        GM_xmlhttpRequest({
            method : "GET",
            url    : twilogUpdateUrl(),
            onload : function(r) {
                if (r.status == 200) {
                    GM_xmlhttpRequest({
                        method : "GET",
                        url    : twilogUrl(),
                        onload : function(r) {
                            if (r.status == 200) {
                                reformatTwilog(r.responseText);
                            } else {
                                alert('twilogとの通信エラーです');
                            }
                        }
                    });
                } else {
                    alert('twilogのログ更新に失敗しました');
                }
            }
        });
    }

    // Make twilog update URL
    //
    function twilogUpdateUrl() {
        var url = "http://twilog.org/update.cgi?id=" + tn.value +
                  "&order=&filter=&kind=reg";
        return url;
    }

    // Make twilog URL
    //
    function twilogUrl() {
        var url = "http://twilog.org/" + tn.value +
                  "/date-" + da.value + "/asc-nomen";
        return url;
    }

    // reformat twilog source
    //
    function reformatTwilog(source) {
        var LF = String.fromCharCode(10);
        var d = document.createElement('div');
        d.innerHTML = source;

        var tiSrc = $X(".//h3[@class='bar-main2']", d);
        if (0 < tiSrc.length) {
            var title = tiSrc[0]
                        .innerHTML.split(LF)[0]
                        .replace(/ */gi, '') + ' のつぶやき';
            var t = $X(".//p[@class='tl-text']", d);
            var p = $X(".//p[@class='tl-posted']/a", d);
            var contents = '';
            for (var i = 0; i < t.length; i++) {
                contents = contents +
                       p[i].innerHTML + '\n' +
                       t[i].innerHTML.replace(/<\/?[^>]+>/gi, '') + '\n\n';
            }
            contents = contents +
                       '--------\n' +
                       '※ Powered by "mixi_from_twilog.user.js" !!\n' +
                       '　 (http://github.com/lolicsystem/mixi_from_twilog)';
            insertTwilog(title, contents);
            GM_setValue("twitter_name", tn.value);
        } else {
            if ($X(".//title", d)[0].textContent == "") {
                alert($X("id('main')/div", d)[0].textContent);
            } else {
                var msg = '';
                var td = dateString(0);
                if (td < da.value)
                    msg = '未来からはつぶやきを取得できません。';
                else if (da.value == td)
                    msg = '今日はまだつぶやいていないみたい。';
                else
                    msg = $X("id('pankuzu')/strong", d)[0].textContent +
                          ' のつぶやきは、twilog 上にないみたい。';
                alert(msg);
            }
        }
    }

    // Insert log into textarea.
    //
    function insertTwilog(title, contents) {
        var ti = $X("//input[@class='editareaWidth']")[0];
        var ta = $X("id('diaryBody')")[0];
        if (overwriteMode) {
            ti.value = title;
            ta.value = contents;
        } else {
            ti.value = ti.value + title;
            ta.value = ta.value + contents;
        }
    }

})();
