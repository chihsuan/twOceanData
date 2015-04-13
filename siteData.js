var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var moment = require('moment');
var fs = require('fs');

var _URL = 'http://edw.epa.gov.tw/ResultSeaSite.aspx?siteid=';

var oceanData = require('./data.json');
var outputData = {};
getSiteData();

function getSiteData () {
  async.waterfall([
    function (){
      for (var name in oceanData) {
        var siteID = oceanData[name]['siteID'];
        request.get(_URL + siteID, function (error, response, body) {
          if(error){
            console.error('Request error.');
          }
          appendSiteData(body);
        });
      }
    }
    ], function (err, outputData) {
      if (err) {
        console.error('Error.');
      }

      if (!outputData || outputData.length === 0) {
        console.log('GET NULL');
      }
   });
};

function appendSiteData (html){

  var $ = cheerio.load(html);
  var attr = ['siteName', 'type', 'area', 'org', 'country', 'address', 'lat','lng'];
  var siteData = {};
  var cols = $('.ht').find('td.hd_1');

  for (var i = 0; i < cols.length; ++ i) {
    siteData[attr[i]] = $(cols).eq(i)
                          .text()
                          .trim()
                          .replace(/(\r\n|\n|\r|\s)/g,'');
  }

  var position = $('#ctl00_ContentPlaceHolder1_Label_SITE_LL')
                  .text()
                  .trim()
                  .replace(/(\r\n|\n|\r|\s)/g,'');

  siteData['lat'] = position.split(',')[1];
  siteData['lng'] = position.split(',')[0];
  outputData[siteData['siteName']] = siteData;
  if (siteData['siteName'] == '北竿東部沿海') {
    console.log(outputData);
    fs.writeFile('site.json', JSON.stringify(outputData));
    console.log('output: site.json');
  }
}
