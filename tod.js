
var seen = {};
var timer;
var storage = window.localStorage;

var audioClick = new Audio('click.mp3');
var audioBong = new Audio('windgong.mp3');

var maleFemale = ["&male;", "&female;"];
var sex;

var consec = [ { }, {} ];

var currentType;
var currentText;

var todData = {};
todData.truth = ["Tell me something about yourself that you have never told anybody."];
todData.dare = ["Take me in your arms and cover me in wet kisses."];

var saved;

var rounds = 0;

var noiseWords = ["the", "a", "to", "and", "for", "you", "your", "an", "of", "it", 
     "what", "where", "would", 
     "minute", "min", "minutes", "mins", "s", "me", "did", "do", "have", "were", 
     "partner", "guy", "guys", "boy", "boys", "women", "girls", "girl"];

function saveScore(text, val) {
  storage.setItem(compress(text), val);
}

function loadScore(text) {
  var result = storage.getItem(compress(text));
  if (!result) {
    return 1;
  }
  return parseFloat(result);
}

function compress(text) {
  const regex = /[^a-zA-Z0-9]/g;
  return 'tod:' + text.replaceAll(regex, '').toLowerCase();
}

function getWordScore(type, word) {
  var key = "tod:" + type + ":" + word.toLowerCase();

  return parseFloat(storage.getItem(key) || 1);
}

function getWords(text) {
  var words = new Set(text.replaceAll("'", "").toLowerCase().match(/\b(\w+)\b/g));
  for (var i = 0; i < noiseWords.length; i++) {
    words.delete(noiseWords[i]);
  }  
  return Array.from(words);
}

function getScore(type, text) {
  var words = getWords(text);
  var score = 0;

  for (var i = 0; i < words.length; i++) {
    score += getWordScore(type, words[i]);
  }
  if (rounds < 8) {
    if (text.startsWith('* ')) {
      score = score * 30 * (8 - rounds);
    }
  }
  return score / words.length;
}

function updateWordScore(type, word) {
  var key = "tod:" + type + ":" + word.toLowerCase();

  storage.setItem(key, getWordScore(type, word) / Math.sqrt(todData[type].length));
}

function updateScore(type, text) {
  var words = getWords(text);

  for (var i = 0; i < words.length; i++) {
    updateWordScore(type, words[i]);
  }
}

function sexOk(text) {
  // See if applicable
  var maleRe = /guy: *|guys: *|boy: *|boys: */i;
  var femaleRe = /women: *|girls: *|girl: */i;

  var isMale = text.match(maleRe);
  var isFemale = text.match(femaleRe);

  if (sex) {
    // female
    if (isMale && !isFemale) {
      return;
    }
  } else {
    // male
    if (isFemale && !isMale) {
      return;
    }
  }

  if (!!isFemale != !!isMale) {
    text = text.replace(maleRe, '').replace(femaleRe, '');
  }

  if (text.startsWith('* ')) {
    text = text.substring(2);
  }

  return text
}

function gettext(type) {
  if (type == 'saved') {
    var i = Math.floor(Math.random() * saved.length);
    var res = saved.splice(i, 1)[0];
    storage.setItem('tod:Saved', JSON.stringify(saved));
    return res;
  }
  if (1) {
    var scores = [];
    for (var i = 0; i < todData[type].length; i++) {
      scores.push(getScore(type, todData[type][i]));
    }
    var total = scores.reduce((a, b) => a + b, 0);
    while (1) {
      var offset = total * Math.random();
      for (var i = 0; i < scores.length - 1; i++) {
	offset -= scores[i];
	if (offset <= 0) {
	  break;
	}
      }
      var q = sexOk(todData[type][i]);
      if (q) {
        updateScore(type, q);
        return q;
      }
    }
  } else {
    if (!seen[type]) {
      var factor = [];
      for (var i = 0; i < todData[type].length; i++) {
	factor.push(loadScore(todData[type][i]));
      }
      seen[type] = factor;
    }

    // Compute weight
    var total = seen[type].reduce((a, b) => a + b, 0);
    var offset = total * Math.random();
    for (var i = 0; i < seen[type].length - 1; i++) {
      offset -= seen[type][i];
      if (offset <= 0) {
	break;
      }
    }
    seen[type][i] /= Math.sqrt(seen[type].length);
    saveScore(todData[type][i], seen[type][i]);
    return todData[type][i];
  }
}

function doSave(type, text) {
  saved.push(text);
  storage.setItem('tod:Saved', JSON.stringify(saved));
  doRound('Later');
}

function clearDisplay(fn) {
  var all = $('.fade-in-text').removeClass('fade-in-text').addClass('fade-out-text');
  if ($(all).length == 0) {
    $('#body').empty();
    fn();
  } else {
    $(all).first().on('animationend', () => {
      $('#body').empty();
      fn();
    });
  }
}

function touchstart(e) {
  e.preventDefault();
  click();
  $(e.currentTarget).trigger('click');
}

function display(type) {
  clearDisplay(() => {
    var text = gettext(type);
    var originalText = text;

    var p = $('<p>');
    var div = $('<div id="statement" class="fade-in-text">');
    $(div).append(p);
    // See if there is a timer
    var time = /(?<t>\d+) (?<u>min|sec)/;

    var found = text.match(time);
    var duration = Math.floor((Math.random() + 1)**2 * 30);
    if (found) {
      duration = found.groups.t * (found.groups.u.startsWith('m') ? 60 : 1);
    } 

    if (text.endsWith('=')) {
      duration = 0;
      text = text.slice(0, -1);
    }

    $(p).text(text);

    $('#body').append(div);

    if (duration && type != 'truth') {
      $(div).append($('<div id=timer class="hit-area-pseudo quick-click" onclick="startTiming(\'#timer\', ' + duration + ');">Start ' + sms(duration) + '</div>'));
    }
    if (type == 'dare') {
      $(div).append($('<div id=later class="hit-area-pseudo quick-click" onclick="doSave(\'' + type + '\', \'' + originalText.replaceAll(/(['"])/g, "\\$1") + '\');">Later</div>'));
    }
    $(div).append($('<div id=next class="hit-area-pseudo quick-click" onclick="doRound(\'Next\', \'' + type + '\');">Next</div>'));

    $('.quick-click').on('touchstart', touchstart);

    currentType = type;
    currentText = text;
  });
}

function sms(d) {
  var s = d % 60;
  var m = (d - s) / 60;
  if (!m) {
    return s + " sec";
  }
  if (s) {
    return m + " min " + s + " sec";
  }
  return m + " min";
}

function ms(d) {
  var s = d % 60;
  var m = (d - s) / 60;
  if (!m) {
    return s + "s";
  }
  return m + "m " + s + "s";
}

function click() {
  audioClick.play();
}

function beep() {
  audioBong.play();
}

function startTiming(sel, duration) {
  $(sel).text(ms(duration));
  duration = duration - 1;
  timer = setInterval(function() { $(sel).text(ms(duration)); duration = duration - 1; if (duration < 0) { $(sel).text(''); clearInterval(timer); timer = null; beep(); } } , 1000);
  
}

function flipSex() {
  sex = 1 - sex;
  $('#malefemale').html(maleFemale[sex]);
  setEnabledToD();
}

function setEnabledToD() {
    var cantruth = (consec[sex].truth || 0) < 3;
    var candare = (consec[sex].dare || 0) < 3;

    if (cantruth) {
      $('#truth').show();
    } else {
      $('#truth').hide();
    }

    if (candare) {
      $('#dare').show();
    } else {
      $('#dare').hide();
    }

    if (candare && cantruth) {
      $('#spacer').show();
    } else {
      $('#spacer').hide();
    }
}

function doRound(button, type) {
  if (button != 'Later') {
    if (consec[sex][type]) {
      consec[sex][type]++;
    } else {
      consec[sex] = { };
      consec[sex][type] = 1;
    }
  }  
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (button != "Later") {
    sex = 1 - sex;
  }
  rounds = rounds + 1;
  clearDisplay(() => {
    // Now put up 'Truth' and 'Dare'
    var div = $('<div class="td fade-in-text"><p id=malefemale class="hit-area-pseudo quick-click" onclick="flipSex();">' + maleFemale[sex] + '</p><p class="hit-area-pseudo quick-click" id=truth onclick="display(\'truth\');">Truth</p><p id=spacer></p><p id=dare class="hit-area-pseudo quick-click" onclick="display(\'dare\');">Dare</p></div>');

    $('#body').append(div);

    if (saved && saved.length > 0) {
      var c = saved.length;
      $(div).append($('<p id=spacer></p><p class="hit-area-pseudo quick-click" onclick="display(\'saved\');">' + c + ' Saved</p>'));
    }

    setEnabledToD();

    $('.quick-click').on('touchstart', touchstart);
  });
}

function doFirstRound(button) {
  document.body.requestFullscreen({ navigationUI: 'hide' });
  screen.orientation.lock('landscape');
  doRound(button);
}

function doReset() {
  storage.clear();
  doStart();
}

function doStart() {
  clearDisplay(() => {
    // Now put up 'Truth' and 'Dare'
    var extra = '';

    if (storage.length > 0) {
     extra = '<div><p class="hit-area-pseudo" onclick="doReset();">Reset game</p>';
    }


    $('#body').append($('<div id="intro" class="td fade-in-text"><div><p class="hit-area-pseudo quick-click" onclick="doFirstRound(\'Play\');">Play Truth or Dare!</p>\
	   <p class="rules">&female; means the woman is asked "Truth or Dare" and responds.<br>\
	                    No more than three truths (or dares) per person in a row.<br>\
			    A timer can be started for time-limited dares.<br>\
	                    Dares can only be deferred to "Later" by mutual agreement.</p>' +
           '<p class="rules">Best played on a tablet. Use touch to select options.</p>' + extra + '</div></div>'));
    $('.quick-click').on('touchstart', touchstart);

    sex = Math.floor(Math.random() * 2);

    saved = storage.getItem("tod:Saved");
    if (saved) {
      saved = JSON.parse(saved);
    } else {
      saved = [];
    }
  });
}

$(document).ready(doStart);

$.ajax({
  url: "/tod-data.json",
  dataType: 'JSON',
}).done(function(data) { todData = data; seen = {} });


if (navigator.serviceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/caching.js', { scope: window.location.pathname })
      .then(registration => {
      })
      .catch(error => {
	console.log(`Service Worker registration failed: ${error}`);
      });
  });
}

