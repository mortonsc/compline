$(function(){
  // the following function is based on one taken from http://www.irt.org/articles/js052/index.htm
  // Y is the year to calculate easter for, e.g., 2017
  function EasterDate(Y) {
    var C = Math.floor(Y/100);
    var N = Y - 19*Math.floor(Y/19);
    var K = Math.floor((C - 17)/25);
    var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
    I = I - 30*Math.floor((I/30));
    I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
    var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
    J = J - 7*Math.floor(J/7);
    var L = I - J;
    var M = 3 + Math.floor((L + 40)/44);
    var D = L + 28 - 31*Math.floor(M/4);

    return moment([Y,M-1,D]);
  }
  function EasterDates(Y) {
    var easter = EasterDate(Y);
    var septuagesima = moment(easter).subtract(7*9,'days');
    var pentecost = moment(easter).add(49,'days');
    return {
      easter: easter,
      septuagesima: septuagesima,
      pentecost: pentecost
    }
  }
  function isTriduum(date) {
    var easter = EasterDate(date.year());
    var maundyThursday = moment(easter).subtract(3,'days');
    return date.isSameOrAfter(maundyThursday) && date.isBefore(easter);
  }
  function isPaschalWeek(date) {
    var easter = EasterDate(date.year());
    var easterSaturday = moment(easter).add(6,'days');
    return date.isSameOrAfter(easter) && date.isBefore(easterSaturday);
  }
  function isPaschalTime(date) {
    var easter = EasterDate(date.year());
    var pentecostSaturday = moment(easter).add(55,'days');
    return date.isSameOrAfter(easter) && date.isBefore(pentecostSaturday);
  }
  function isAdvent(date) {
    var christmas = moment([date.year(),11,25]);
    var advent1 = moment(christmas).subtract((christmas.day() || 7) + 7*3,'days');
    return date.isSameOrAfter(moment(advent1).subtract(1,'day')) && date.isSameOrBefore(moment(christmas).subtract(1,'day'));
  }
  $.QueryString = (function (a) {
      if (a == "") return {};
      var b = {};
      for (var i = 0; i < a.length; ++i) {
          var p = a[i].split('=');
          if (p.length != 2) continue;
          b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
      }
      if (b.successMsg) showAlert(false, b.successMsg);
      if (b.failMsg) showAlert(true, b.failMsg);
      return b;
  })(window.location.search.substr(1).split('&'));
  var date = moment();
  
  $('#date').val(date.format("YYYY-MM-DD"));
  var day = date.day();
  var dayName;
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  if($.QueryString.day) {
    var test = $.QueryString.day;
    if(test in days) {
      day = test;
    } else {
      test = days.indexOf(test);
      if(test in days) {
        day = test;
      }
    }
  }
  var setPsalms = function(day,paschalTime) {
    pt = paschalTime?'-PT':'';
    var ant = paschalTime?
      "<chant-gabc src='psalms/ant-PT.gabc'></chant-gabc>" :
      "<chant-gabc src='psalms/"+day+"/ant.gabc'></chant-gabc>";
    var psalm = "<chant-gabc src='psalms/"+day+"/psalm"+pt+".gabc'></chant-gabc>";
    dayName = days[day];
    $('#weekday').text(dayName);
    var gotData = function(data){
      var html = ant + psalm + data + ant;
      $('#placeholder').empty().append(html);
    };
    $.get('psalms/'+day+'/psalm-verses'+pt+'.html',gotData).error(function(){
      $.get('psalms/'+day+'/psalm-verses.html',gotData);
    });
  }
  var setDate = function(date) {
    var isPT = isPaschalTime(date);
    if(isPT && isPaschalWeek(date)) {
      setPsalms(0,true);
      $('#weekday').text('Easter Week');
    } else if(isTriduum(date)) {
      var day = date.day();
      setPsalms(day,false);
      var name;
      switch(day) {
        case 4:
          name = 'Maundy Thursday';
          break;
        case 5:
          name = 'Good Friday';
          break;
        case 6:
          name = 'Holy Saturday';
          break;
      }
      $('#weekday').text(name);
    } else {
      setPsalms(date.day(),isPT);
    }
    $('.radio-pt').prop('checked',isPT).change();
    if(isAdvent(date)) {
      $('.radio-advent').prop('checked',true).change();
    }
    if(date.isBefore(moment([date.year(), 1, 2]))) {
      $('.radio-till-feb2').prop('checked',true).change();
    } else if(date.isBefore(moment(EasterDate(date.year())).subtract(3,'days'))) {
      $('.radio-feb2-till-spy-wed').prop('checked',true).change();
    }
    if((day == 0 || day == 6) && $('#te-lucis-Ferial').prop('checked')) {
      $('#te-lucis-Ordinary').prop('checked',true).change();
    }
  }
  $('#date').change(function(){
    setDate(moment($(this).val()));
  }).change();
  var setChantSrc = function($elem,src){
    if(!$elem || $elem.length == 0) return;
    $elem.attr('src',src);
    $elem.data('setSrc')(src);
  };
  $('[id$=-choices] input').change(function(){
    var chant = this.name;
    if(chant=='season') {
      //setPsalms(day,this.value=='paschal');
      return;
    }
    var src = chant + '/' + this.value + '.gabc';
    console.info(src);
    setChantSrc($('#'+chant),src);
    var $div = $('chant-gabc[' + this.id + ']');
    if($div.length > 0) {
      setChantSrc($div,$div.attr(this.id));
    }
    $('div.' + chant).hide();
    $('div.' + chant + '.' + this.value).show();
  });
});